import { StreamTransport, DependencyContainer } from '@mse-player/core';
import { SessionOptions } from '../api/session';
import { BufferController } from './buffer-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { SessionErrorManager } from './session-error-manager';
import { SessionStateManager } from './session-state-manager';

export class SessionController {
    private bufferController: BufferController | null;
    private readonly errorManager = new SessionErrorManager();
    private readonly stateManager = new SessionStateManager(this.videoElementWrapper);
    public readonly onError = this.errorManager.onError;
    public readonly onStateChanged = this.stateManager.onStateChanged;
    public readonly onPositionUpdate = this.videoElementWrapper.onPositionUpdate;

    constructor(private videoElementWrapper: VideoElementWrapper, private streamTransport: StreamTransport) {
        this.errorManager.registerErrorEmitter(videoElementWrapper.getErrorEmitter());
        this.errorManager.onError.register(() => {
            this.stop();
        });
    }

    public async load(options: SessionOptions): Promise<void> {
        const manifestAquisition = await this.stateManager.decorateLoadManifest(() => this.streamTransport.getStreamDescriptor());
        if (!manifestAquisition.isSuccess || !manifestAquisition.streamDescriptor) {
            return Promise.reject();
        }

        const abr = DependencyContainer.getAbr(manifestAquisition.streamDescriptor);
        const bufferController = new BufferController(this.videoElementWrapper, manifestAquisition.streamDescriptor, abr);
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
