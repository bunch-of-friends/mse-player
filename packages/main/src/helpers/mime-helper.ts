import { AdaptationSet } from '@mse-player/core';
import { Representation } from '@mse-player/core';

export function getMimeCodec(adaptationSet: AdaptationSet, representation?: Representation): string {
    if (representation) {
        return pattern(adaptationSet.mimeType, representation.codecs);
    } else {
        const representations = adaptationSet.representations;
        return pattern(adaptationSet.mimeType, filterUnique(representations.map(x => x.codecs)).join(','));
    }
}

function filterUnique<T>(array: Array<T>): Array<T> {
    return array.filter((item, index) => array.indexOf(item) === index);
}

function pattern(mimeType: string, codecs: string): string {
    return `${mimeType}; codecs="${codecs}"`;
}
