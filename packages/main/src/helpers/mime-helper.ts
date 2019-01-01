import { AdaptationSet } from '@mse-player/core';

export function getMimeCodec(adaptationSet: AdaptationSet): string {
    const representations = adaptationSet.representations;
    return adaptationSet.mimeType + ';codecs="' + representations.map(x => x.codecs).join(',') + '"';
}
