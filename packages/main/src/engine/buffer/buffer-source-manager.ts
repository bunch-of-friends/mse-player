import { MediaState } from '../session/session-state-manager';
import { StreamPosition } from '../../api/session';
import { ErrorEmitter } from '../session/session-error-manager';
import { MediaSourceWrapper } from './media-source-wrapper';
import { SegmentAcquisitionManager } from '../acquisition/segment-acqusition-manager';
import { StreamInfo, AdaptationSetType, Segment, AdaptationSet, Representation } from '@mse-player/core';
import { VideoElementWrapper } from '../session/video-element-wrapper';
import { unwrap } from '../../helpers/unwrap';

export class BufferSourceManager {
    private isStopped = false;
    private adapdationSets: Array<AdaptationSet>;
    private mediaSourceWrapper: MediaSourceWrapper | null;
    constructor(
        private readonly errorEmitter: ErrorEmitter,
        private readonly streamInfo: StreamInfo,
        private readonly segmentAcquisitionManager: SegmentAcquisitionManager,
        private readonly videoElementWrapper: VideoElementWrapper
    ) {
        this.adapdationSets = segmentAcquisitionManager.getAdapdationSets();

        this.videoElementWrapper.onMediaStateChanged.register(state => {
            //
        });

        this.videoElementWrapper.onPositionUpdate.register(position => {
            //
        });
    }

    public async initialise(position: number): Promise<void> {
        this.mediaSourceWrapper = await this.createMediaSourceWrapper(this.adapdationSets);

        this.adapdationSets.forEach(a => {
            this.appendAllSegments(a, position);
        });
    }

    public stop() {
        this.isStopped = true;
        if (this.mediaSourceWrapper) {
            this.mediaSourceWrapper.dispose();
            this.mediaSourceWrapper = null;
        }
    }

    private createMediaSourceWrapper(adapdationSets: Array<AdaptationSet>): Promise<MediaSourceWrapper> {
        if (!this.segmentAcquisitionManager || !this.streamInfo) {
            throw 'segmentAcquisitionManager or streamInfo is null';
        }

        const mediaSourceWrapper = new MediaSourceWrapper(this.errorEmitter, this.streamInfo, adapdationSets);
        this.videoElementWrapper.setSource(mediaSourceWrapper.getSourceUrl());

        return new Promise(resolve => {
            const observer = mediaSourceWrapper.onBufferOpen.register(() => {
                mediaSourceWrapper.onBufferOpen.unregister(observer);
                resolve(mediaSourceWrapper);
            });
        });
    }

    private async appendAllSegments(adaptation: AdaptationSet, startingPosition: number): Promise<void> {
        let currentBufferEnd = startingPosition;
        while (currentBufferEnd <= unwrap(this.mediaSourceWrapper).getBufferDuration()) {
            await this.acquireAndAppendSegment(adaptation, 0, true);
            const nextSegment = await this.acquireAndAppendSegment(adaptation, currentBufferEnd);
            if (!nextSegment) {
                return;
            }
            currentBufferEnd = nextSegment.segmentEndTime;
        }
    }

    private async acquireAndAppendSegment(adaptation: AdaptationSet, position: number, isInitSegment = false): Promise<Segment | null> {
        const result = await this.segmentAcquisitionManager.acquireSegment(adaptation, position, isInitSegment);

        if (this.isStopped) {
            return null;
        }

        if (!this.mediaSourceWrapper) {
            return null;
        }

        if (result.acquisition.isNotAvailable) {
            return null;
        }

        if (result.acquisition.isError && result.acquisition.error) {
            this.errorEmitter.notifyError(result.acquisition.error);
            return null;
        }

        if (result.acquisition.isSuccess && result.acquisition.segment) {
            this.mediaSourceWrapper.appendSegment(adaptation, result.representation, result.acquisition.segment);
            return result.acquisition.segment;
        }

        throw 'append segment - didnt expect to get here';
    }
}
