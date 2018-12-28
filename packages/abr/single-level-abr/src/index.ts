import { Abr, Representation, AdaptationSet } from '@mse-player/core';

export class SingleLevelAbr extends Abr {
    public getNextSegmentRepresentation(adapdationSet: AdaptationSet): Representation {
        return adapdationSet.representations[0];
    }
}
