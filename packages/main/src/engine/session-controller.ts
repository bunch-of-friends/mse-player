import { StreamTransport, Abr, DependencyContainer } from '@mse-player/core';
import { SessionOptions } from '../api/session';
import { BufferController } from './buffer-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { SessionErrorManager } from './session-error-manager';
import { SessionStateManager } from './session-state-manager';

export class SessionController {
    private errorManager = new SessionErrorManager();
    private stateManager = new SessionStateManager();
    private bufferController: BufferController | null;

    public onError = this.errorManager.onError;
    public onStateChanged = this.stateManager.onStateChanged;
    public onPositionUpdate = this.videoElementWrapper.onPositionUpdate;

    constructor(private videoElementWrapper: VideoElementWrapper, private streamTransport: StreamTransport) {
        this.errorManager.registerErrorEmitter(videoElementWrapper.getErrorEmitter());
    }

    public async load(options: SessionOptions): Promise<void> {
        const streamDescriptor = await this.stateManager.decorateLoadManifest(() => this.streamTransport.getStreamDescriptor());

        const abr = DependencyContainer.getAbr(streamDescriptor);
        const bufferController = new BufferController(this.videoElementWrapper, streamDescriptor, abr);
        this.bufferController = bufferController;

        return this.stateManager.decorateInitialBuffering(() => {
            bufferController.startFillingBuffer(options.startingPosition);
            return this.play();
        });
    }

    public pause(): void {
        if (!this.bufferController) {
            return;
        }
        this.bufferController.pause();
        this.videoElementWrapper.pause();
    }

    public play(): Promise<void> {
        if (!this.bufferController) {
            return Promise.reject('invalid state: buffer manager not set');
        }
        this.bufferController.play();
        return this.videoElementWrapper.play();
    }

    public stop(): Promise<void> {
        if (this.bufferController) {
            this.bufferController.dispose();
            this.bufferController = null;
        }
        this.errorManager.dispose();

        return this.videoElementWrapper.stop();
    }
}
