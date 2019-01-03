import { SegmentAcquisition, Abr, AdaptationSet, Representation, InternalError } from '@mse-player/core';
import { EventEmitter } from '../../common/event-emitter';

export class SegmentAcquisitionManager {
    private readonly errorEmitter = new EventEmitter<InternalError>('segmentAcquisition');
    private currentAcquisitionPromise: Promise<SegmentAcquisition> | null;

    constructor(private abr: Abr) {}

    public getStartingRepresentation(adapdationSet: AdaptationSet): Representation {
        return this.abr.getNextSegmentRepresentation(adapdationSet);
    }

    public getErrorEmitter() {
        return this.errorEmitter;
    }

    public isAcquiring(): boolean {
        return this.currentAcquisitionPromise !== null;
    }

    public async acquireSegment(
        adapdationSet: AdaptationSet,
        position: number,
        isInitSegment = false
    ): Promise<{ acquisition: SegmentAcquisition; representation: Representation }> {
        const representation = this.abr.getNextSegmentRepresentation(adapdationSet);

        this.currentAcquisitionPromise = isInitSegment
            ? representation.segmentProvider.getInitSegment()
            : representation.segmentProvider.getNextSegment(position);

        const acquisition = await this.currentAcquisitionPromise;
        this.currentAcquisitionPromise = null;
        return {
            acquisition,
            representation,
        };
    }

    public getAdapdationSets(): Array<AdaptationSet> {
        return this.abr.getAdaptationSets();
    }
}
