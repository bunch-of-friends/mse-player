import { Abr, Representation, AdaptationSetType, AdaptationSet } from '@mse-player/core';

export class SingleLevelAbr extends Abr {
    public getStartingRepresentation(adaptationSet: AdaptationSet): Representation {
        return adaptationSet.representations[0];
    }

    public getNextSegmentRepresentation(adaptationSet: AdaptationSet): Representation {
        return adaptationSet.representations[0];
    }

    public getAdaptationSets(): Array<AdaptationSet> {
        return this.streamDescriptor.adaptationSets;
    }
}
