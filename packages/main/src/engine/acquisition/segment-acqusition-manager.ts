import { StreamDescriptor, SegmentAcquisition, AdaptationSetType, Abr, AdaptationSet, Representation } from '@mse-player/core';
import { ErrorEmitter } from '../session/session-error-manager';

export class SegmentAcquisitionManager {
    private readonly errorEmitter = new ErrorEmitter('segmentAcquisition');
    private currentAcquisitionPromise: Promise<SegmentAcquisition> | null;

    constructor(private abr: Abr) {}

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
