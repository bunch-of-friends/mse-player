import { StreamTransport, DependencyContainer } from '@mse-player/core';
import { SessionOptions } from '../api/session';
import { BufferManager } from './buffer-manager';
import { VideoElementWrapper } from './video-element-wrapper';
import { SessionErrorManager } from './session-error-manager';
import { SessionStateManager } from './session-state-manager';
import { ManifestAcquisitionManager } from './manifest-acquisition-manager';
import { SegmentAcquisitionManager } from './segment-acqusition-manager';

export class SessionController {
    private readonly bufferManager: BufferManager;
    private readonly errorManager = new SessionErrorManager();
    private readonly stateManager = new SessionStateManager(this.videoElementWrapper);
    private readonly manifestAcquisitionManager: ManifestAcquisitionManager;
    public readonly onError = this.errorManager.onError;
    public readonly onStateChanged = this.stateManager.onStateChanged;
    public readonly onPositionUpdate = this.videoElementWrapper.onPositionUpdate;

    constructor(private readonly videoElementWrapper: VideoElementWrapper, streamTransport: StreamTransport) {
        this.manifestAcquisitionManager = new ManifestAcquisitionManager(this.stateManager, streamTransport);
        this.bufferManager = new BufferManager(this.videoElementWrapper);
        videoElementWrapper.onPositionUpdate.register(p => this.bufferManager.onPositionUpdate(p.currentTime));
        this.errorManager.onError.register(() => {
            this.stop();
        });

        this.errorManager.registerErrorEmitter(videoElementWrapper.getErrorEmitter());
        this.errorManager.registerErrorEmitter(this.manifestAcquisitionManager.getErrorEmitter());
        this.errorManager.registerErrorEmitter(this.bufferManager.getErrorEmitter());
    }

    public async load(options: SessionOptions): Promise<void> {
        const streamDescriptor = await this.manifestAcquisitionManager.loadStreamDescriptor();
        const abr = DependencyContainer.getAbr(streamDescriptor);
        const segmentAcquisitionManager = new SegmentAcquisitionManager(abr);

        this.errorManager.registerErrorEmitter(segmentAcquisitionManager.getErrorEmitter());

        return this.stateManager.decorateInitialBuffering(() => {
            this.bufferManager.initialise(options.startingPosition, segmentAcquisitionManager, streamDescriptor.streamInfo);
            return this.play();
        });
    }

    public pause(): void {
        this.bufferManager.pause();
        this.videoElementWrapper.pause();
    }

    public play(): Promise<void> {
        this.bufferManager.play();
        return this.videoElementWrapper.play();
    }

    public stop(): Promise<void> {
        return this.stateManager.decorateSessionStopping(() => {
            this.bufferManager.dispose();
            this.errorManager.dispose();
            return this.videoElementWrapper.stop();
        });
    }
}
