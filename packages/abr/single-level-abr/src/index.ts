import { Abr, Representation, AdaptationSetType, AdaptationSet } from '@mse-player/core';

export class SingleLevelAbr extends Abr {
    public getNextSegmentRepresentation(adaptationSet: AdaptationSet): Representation {
        return adaptationSet.representations[0];
    }

    public getAdaptationSet(adaptationType: AdaptationSetType): AdaptationSet | null {
        const adapdationSet = this.streamDescriptor.adaptationSets.find(x => x.type === adaptationType);
        return adapdationSet || null;
    }
}
