import { VideoElementWrapper } from './video-element-wrapper';
import { MediaState } from './session-state-manager';
import { StreamPosition } from '../api/session';
import { ErrorEmitter } from './session-error-manager';
import { Observable } from '@bunch-of-friends/observable';
import { MediaSourceWrapper } from './media-source-wrapper';
import { SegmentAcquisitionManager } from './segment-acqusition-manager';
import { StreamInfo, AdaptationSetType, Segment } from '@mse-player/core';

export class BufferSizeManager {
    private isStopped = false;
    constructor(
        private errorEmitter: ErrorEmitter,
        private mediaSourceWrapper: MediaSourceWrapper,
        private segmentAcquisitionManager: SegmentAcquisitionManager,
        private onMediaStateChanged: Observable<MediaState>,
        private onPositionChanged: Observable<StreamPosition>
    ) {
        this.onMediaStateChanged.register(() => {});

        this.onPositionChanged.register(() => {});
    }

    public start(position: number) {
        this.appendSegment(0, true).then(() => {
            this.appendAllSegments(position);
        });
    }

    public stop() {
        this.isStopped = true;
        this.mediaSourceWrapper.dispose();
    }

    private async appendSegment(position: number, isInitSegment = false): Promise<Segment | null> {
        const segmentAcquisition = await this.segmentAcquisitionManager.acquireSegment(AdaptationSetType.Video, position, isInitSegment);

        if (this.isStopped) {
            return null;
        }

        if (segmentAcquisition.isNotAvailable) {
            return null;
        }

        if (segmentAcquisition.isError && segmentAcquisition.error) {
            this.errorEmitter.notifyError(segmentAcquisition.error);
            return null;
        }

        if (segmentAcquisition.isSuccess && segmentAcquisition.segment) {
            this.mediaSourceWrapper.appendSegment(AdaptationSetType.Video, segmentAcquisition.segment);
            return segmentAcquisition.segment;
        }

        throw 'append segment - didnt expect to get here';
    }

    private async appendAllSegments(startingPosition: number): Promise<void> {
        let currentBufferEnd = startingPosition;
        while (currentBufferEnd <= this.mediaSourceWrapper.getBufferDuration()) {
            const nextSegment = await this.appendSegment(currentBufferEnd);
            if (!nextSegment) {
                return;
            }
            currentBufferEnd = nextSegment.segmentEndTime;
        }
    }
}
