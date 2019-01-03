import { MediaSourceWrapper } from './media-source-wrapper';
import { SegmentAcquisitionManager } from '../acquisition/segment-acqusition-manager';
import { StreamInfo, Segment, AdaptationSet, InternalError, AdaptationSetType } from '@mse-player/core';
import { VideoElementWrapper } from '../session/video-element-wrapper';
import { unwrap } from '../../helpers/unwrap';
import { EventEmitter } from '../../common/event-emitter';

export class BufferSourceManager {
    private isStopped = false;
    private adapdationSets: Array<AdaptationSet>;
    private mediaSourceWrapper: MediaSourceWrapper | null;
    constructor(
        private readonly errorEmitter: EventEmitter<InternalError>,
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
        this.mediaSourceWrapper = await this.createMediaSourceWrapper();

        const startingRepresentations = this.adapdationSets.map(a => {
            return {
                adaptationSet: a,
                representation: this.segmentAcquisitionManager.getStartingRepresentation(a),
            };
        });

        this.mediaSourceWrapper.initialiseSources(startingRepresentations);
        this.adapdationSets.forEach(x => {
            this.appendAllSegments(x, position);
        });
    }

    public stop() {
        this.isStopped = true;
        if (this.mediaSourceWrapper) {
            this.mediaSourceWrapper.dispose();
            this.mediaSourceWrapper = null;
        }
    }

    private createMediaSourceWrapper(): Promise<MediaSourceWrapper> {
        const mediaSourceWrapper = new MediaSourceWrapper(this.errorEmitter, this.streamInfo);
        this.videoElementWrapper.setSource(mediaSourceWrapper.getSourceUrl());

        return new Promise(resolve => {
            const observer = mediaSourceWrapper.onBufferOpen.register(() => {
                mediaSourceWrapper.onBufferOpen.unregister(observer);
                resolve(mediaSourceWrapper);
            });
        });
    }

    private async appendAllSegments(adaptation: AdaptationSet, startingPosition: number): Promise<void> {
        await this.acquireAndAppendSegment(adaptation, 0, true);
        let currentBufferEndPosition = startingPosition;
        while (currentBufferEndPosition <= unwrap(this.mediaSourceWrapper).getBufferDuration()) {
            const nextSegment = await this.acquireAndAppendSegment(adaptation, currentBufferEndPosition);
            if (!nextSegment) {
                return;
            }
            currentBufferEndPosition = nextSegment.segmentEndTime;
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
            this.errorEmitter.notifyEvent(result.acquisition.error);
            return null;
        }

        if (result.acquisition.isSuccess && result.acquisition.segment) {
            this.mediaSourceWrapper.appendSegment(adaptation, result.representation, result.acquisition.segment);
            return result.acquisition.segment;
        }

        throw 'append segment - didnt expect to get here';
    }
}
