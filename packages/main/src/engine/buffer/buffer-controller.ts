import { StreamInfo } from '@mse-player/core';
import { VideoElementWrapper } from '../session/video-element-wrapper';
import { ErrorEmitter } from '../session/session-error-manager';
import { SegmentAcquisitionManager } from '../acquisition/segment-acqusition-manager';
import { BufferSourceManager } from './buffer-source-manager';

export class BufferController {
    private readonly errorEmitter = new ErrorEmitter('bufferController');
    private isInErrorState = false;
    private bufferSourceManager: BufferSourceManager | null;

    constructor(private readonly videoElementWrapper: VideoElementWrapper) {}

    public async initialise(segmentAcquisitionManager: SegmentAcquisitionManager, streamInfo: StreamInfo, startingPosition: number): Promise<void> {
        if (this.isInErrorState) {
            return Promise.reject();
        }
        this.bufferSourceManager = new BufferSourceManager(this.errorEmitter, streamInfo, segmentAcquisitionManager, this.videoElementWrapper);
        return this.bufferSourceManager.initialise(startingPosition);
    }

    public getErrorEmitter(): ErrorEmitter {
        return this.errorEmitter;
    }

    public stop(): void {
        if (this.bufferSourceManager) {
            this.bufferSourceManager.stop();
        }
    }
}
