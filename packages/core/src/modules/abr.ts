import { StreamDescriptor, Representation, AdaptationSet, AdaptationSetType } from './stream-transport';

export interface AbrCtr {
    new (streamDescriptor: StreamDescriptor): Abr;
}

export abstract class Abr {
    constructor(protected streamDescriptor: StreamDescriptor) {}
    public abstract getNextSegmentRepresentation(adaptationSet: AdaptationSet): Representation;

    public abstract getAdaptationSet(adaptationType: AdaptationSetType): AdaptationSet | null;
}
