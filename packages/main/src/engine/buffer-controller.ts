import { AdaptationSetType, InternalError, StreamInfo } from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';
import { SegmentAcquisitionManager } from './segment-acqusition-manager';
import { MediaSourceWrapper } from './media-source-wrapper';
import { BufferSizeManager } from './buffer-size-manager';
import { EventEmitter } from './event-emitter';

export class BufferController {
    private readonly errorEmitter = new EventEmitter<InternalError>('bufferController');
    private isInErrorState = false;
    private streamInfo: StreamInfo | null;
    private bufferSizeManager: BufferSizeManager | null;
    private segmentAcquisitionManager: SegmentAcquisitionManager | null;

    constructor(private readonly videoElementWrapper: VideoElementWrapper) {}

    public async initialise(segmentAcquisitionManager: SegmentAcquisitionManager, streamInfo: StreamInfo, startingPosition: number): Promise<void> {
        if (this.isInErrorState) {
            return Promise.reject();
        }
        this.segmentAcquisitionManager = segmentAcquisitionManager;
        this.streamInfo = streamInfo;

        const mediaSourceWrapper = await this.createMediaSourceWrapper();
        this.bufferSizeManager = new BufferSizeManager(
            this.errorEmitter,
            mediaSourceWrapper,
            this.segmentAcquisitionManager,
            this.videoElementWrapper.onMediaStateChanged,
            this.videoElementWrapper.onPositionUpdate
        );
        this.bufferSizeManager.start(startingPosition);
    }

    public getErrorEmitter(): EventEmitter<InternalError> {
        return this.errorEmitter;
    }

    public stop(): void {
        if (this.bufferSizeManager) {
            this.bufferSizeManager.stop();
        }
    }

    private createMediaSourceWrapper(): Promise<MediaSourceWrapper> {
        if (!this.segmentAcquisitionManager || !this.streamInfo) {
            throw 'segmentAcquisitionManager or streamInfo is null';
        }

        const videoAdapdationSet = this.segmentAcquisitionManager.getAdapdationSet(AdaptationSetType.Video);
        const audioAdapdationSet = this.segmentAcquisitionManager.getAdapdationSet(AdaptationSetType.Audio);

        const mediaSourceWrapper = new MediaSourceWrapper(this.errorEmitter, this.streamInfo, videoAdapdationSet, audioAdapdationSet);
        this.videoElementWrapper.setSource(mediaSourceWrapper.getSourceUrl());

        return new Promise(resolve => {
            const observer = mediaSourceWrapper.onBufferOpen.register(() => {
                mediaSourceWrapper.onBufferOpen.unregister(observer);
                resolve(mediaSourceWrapper);
            });
        });
    }
}
