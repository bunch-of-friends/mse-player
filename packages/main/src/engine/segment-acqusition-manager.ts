import { StreamDescriptor, SegmentAcquisition, AdaptationSetType, Abr, AdaptationSet } from '@mse-player/core';
import { ErrorEmitter } from './session-error-manager';

export class SegmentAcquisitionManager {
    private readonly errorEmitter = new ErrorEmitter('segmentAcquisition');

    constructor(private abr: Abr) {}

    public getErrorEmitter() {
        return this.errorEmitter;
    }

    public acquireSegment(type: AdaptationSetType, position: number, isInitSegment = false): Promise<SegmentAcquisition> {
        const representation = this.abr.getNextSegmentRepresentation(this.getAdapdationSet(type));
        return isInitSegment ? representation.segmentProvider.getInitSegment() : representation.segmentProvider.getNextSegment(position);
    }

    public getAdapdationSet(type: AdaptationSetType): AdaptationSet {
        const adaptationSet = this.abr.getAdaptationSet(AdaptationSetType.Video);
        if (!adaptationSet) {
            throw 'adapdation set not found for: ' + type;
        }
        return adaptationSet;
    }
}
