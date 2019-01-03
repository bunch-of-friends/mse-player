import { StreamDescriptor, SegmentAcquisition, AdaptationSetType, Abr, AdaptationSet, InternalError } from '@mse-player/core';
import { EventEmitter } from './event-emitter';
export class SegmentAcquisitionManager {
    private readonly errorEmitter = new EventEmitter<InternalError>('segmentAcquisition');
    private currentAquisitionPromise: Promise<SegmentAcquisition> | null;

    constructor(private abr: Abr) {}

    public getErrorEmitter() {
        return this.errorEmitter;
    }

    public isAcquiring(): boolean {
        return this.currentAquisitionPromise !== null;
    }

    public async acquireSegment(type: AdaptationSetType, position: number, isInitSegment = false): Promise<SegmentAcquisition> {
        const representation = this.abr.getNextSegmentRepresentation(this.getAdapdationSet(type));

        this.currentAquisitionPromise = isInitSegment
            ? representation.segmentProvider.getInitSegment()
            : representation.segmentProvider.getNextSegment(position);

        const aquisition = await this.currentAquisitionPromise;
        this.currentAquisitionPromise = null;
        return aquisition;
    }

    public getAdapdationSet(type: AdaptationSetType): AdaptationSet {
        const adaptationSet = this.abr.getAdaptationSet(AdaptationSetType.Video);
        if (!adaptationSet) {
            throw 'adapdation set not found for: ' + type;
        }
        return adaptationSet;
    }
}
