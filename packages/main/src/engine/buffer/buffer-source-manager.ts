import { MediaSourceWrapper } from './media-source-wrapper';
import { SegmentAcquisitionManager } from '../acquisition/segment-acqusition-manager';
import { StreamInfo, Segment, AdaptationSet, InternalError, AdaptationSetType } from '@mse-player/core';
import { VideoElementWrapper } from '../session/video-element-wrapper';
import { EventEmitter } from '../../common/event-emitter';
import { BufferWindowManager } from './buffer-window-manager';
import { StreamPosition } from '../../api/session';

export class BufferSourceManager {
    private isStopped = false;
    private lastPositionUpdate: StreamPosition | null = null;
    private adapdationSets: Array<AdaptationSet>;
    private mediaSourceWrapper: MediaSourceWrapper | null;
    private bufferWindowManager = new BufferWindowManager({ windowStartOffset: -30, windowEndOffset: 60 });
    private currentAcquisitioninProgress: Array<Promise<void>> | null = null;

    constructor(
        private readonly errorEmitter: EventEmitter<InternalError>,
        private readonly streamInfo: StreamInfo,
        private readonly segmentAcquisitionManager: SegmentAcquisitionManager,
        private readonly videoElementWrapper: VideoElementWrapper
    ) {
        this.adapdationSets = segmentAcquisitionManager.getAdapdationSets();

        this.videoElementWrapper.onPositionUpdate.register(position => {
            this.lastPositionUpdate = position;
            this.checkBufferStatus(position.currentTime);
        });
    }

    public async initialise(startingTime: number): Promise<void> {
        this.mediaSourceWrapper = await this.createMediaSourceWrapper();

        const startingRepresentations = this.adapdationSets.map(a => {
            return {
                adaptationSet: a,
                representation: this.segmentAcquisitionManager.getStartingRepresentation(a),
            };
        });

        this.mediaSourceWrapper.initialiseSources(startingRepresentations);
        this.checkBufferStatus(startingTime);
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

    private checkBufferStatus(currentTime: number) {
        if (this.currentAcquisitioninProgress) {
            return;
        }

        if (!this.mediaSourceWrapper) {
            return;
        }

        const appendRequiredResult = this.bufferWindowManager.isAppendRequired(currentTime, this.mediaSourceWrapper.getBufferInfo(currentTime));
        if (!appendRequiredResult.isAppendRequired) {
            return;
        }

        this.currentAcquisitioninProgress = appendRequiredResult.adaptationSetsRequired.map(x => {
            return this.acquireAndAppendSegment(x.adaptationSet, x.lastSegmentEnd);
        });

        Promise.all(this.currentAcquisitioninProgress).then(() => {
            this.currentAcquisitioninProgress = null;
            if (this.lastPositionUpdate) {
                this.checkBufferStatus(this.lastPositionUpdate.currentTime);
            }
        });
    }

    private async acquireAndAppendSegment(adaptation: AdaptationSet, lastSegmentEndTime: number): Promise<void> {
        const acquisition = await this.segmentAcquisitionManager.acquireSegment(adaptation, lastSegmentEndTime);

        if (this.isStopped || !this.mediaSourceWrapper) {
            return;
        }

        if (!acquisition.isSuccess) {
            this.errorEmitter.notifyEvent(acquisition.error);
            return;
        }

        if (acquisition.payload.initSegment) {
            await this.mediaSourceWrapper.appendSegment(adaptation, acquisition.payload.representation, acquisition.payload.initSegment);
        }
        await this.mediaSourceWrapper.appendSegment(adaptation, acquisition.payload.representation, acquisition.payload.segment);
    }
}
