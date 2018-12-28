import { StreamDescriptor, Representation, AdaptationSet } from './stream-transport';

export interface AbrCtr {
    new (streamDescriptor: StreamDescriptor): Abr;
}

export abstract class Abr {
    constructor(protected streamDescriptor: StreamDescriptor) {}
    public abstract getNextSegmentRepresentation(adapdationSet: AdaptationSet): Representation;
}
