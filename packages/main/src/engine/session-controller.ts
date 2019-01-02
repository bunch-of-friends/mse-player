import { StreamTransport } from '@mse-player/core';
import { DependencyContainer } from '../dependency/dependency-container';
import { SessionOptions } from '../api/session';
import { BufferController } from './buffer-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { SessionErrorManager } from './session-error-manager';
import { SessionStateManager } from './session-state-manager';
import { ManifestAcquisitionManager } from './manifest-acquisition-manager';
import { SegmentAcquisitionManager } from './segment-acqusition-manager';

export class SessionController {
    private readonly bufferController: BufferController;
    private readonly errorManager = new SessionErrorManager();
    private readonly stateManager = new SessionStateManager(this.videoElementWrapper);
    private readonly manifestAcquisitionManager: ManifestAcquisitionManager;
    public readonly onError = this.errorManager.onError;
    public readonly onStateChanged = this.stateManager.onStateChanged;
    public readonly onPositionUpdate = this.videoElementWrapper.onPositionUpdate;

    constructor(private readonly videoElementWrapper: VideoElementWrapper, streamTransport: StreamTransport) {
        this.manifestAcquisitionManager = new ManifestAcquisitionManager(streamTransport);
        this.bufferController = new BufferController(this.videoElementWrapper);
        this.errorManager.onError.register(() => {
            this.stop();
        });

        this.errorManager.registerErrorEmitter(videoElementWrapper.getErrorEmitter());
        this.errorManager.registerErrorEmitter(this.manifestAcquisitionManager.getErrorEmitter());
        this.errorManager.registerErrorEmitter(this.bufferController.getErrorEmitter());
    }

    public async load(options: SessionOptions): Promise<void> {
        const streamDescriptor = await this.stateManager.decorateLoadStreamDescriptor(() =>
            this.manifestAcquisitionManager.loadStreamDescriptor(options.url)
        );

        const abr = DependencyContainer.getAbr(streamDescriptor);
        const segmentAcquisitionManager = new SegmentAcquisitionManager(abr);
        this.errorManager.registerErrorEmitter(segmentAcquisitionManager.getErrorEmitter());

        return this.stateManager.decorateInitialBuffering(async () => {
            await this.bufferController.initialise(segmentAcquisitionManager, streamDescriptor.streamInfo, options.startingPosition);
            return this.play();
        });
    }

    public pause(): void {
        this.videoElementWrapper.pause();
    }

    public play(): Promise<void> {
        return this.videoElementWrapper.play();
    }

    public stop(): Promise<void> {
        return this.stateManager.decorateSessionStopping(() => {
            this.bufferController.stop();
            this.errorManager.dispose();
            return this.videoElementWrapper.stop();
        });
    }
}
