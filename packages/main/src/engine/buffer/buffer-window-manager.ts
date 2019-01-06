import { AdaptationSet } from '@mse-player/core';
import { BufferInfo } from './media-source-wrapper';

export class BufferWindowManager {
    constructor(private config: BufferSizeConfiguration) {
        if (config.windowStartOffset > 0) {
            throw 'windowStartOffset exected to be 0 or negative number';
        }

        if (config.windowEndOffset <= 0) {
            throw 'windowEndOffset expected to be a positive number';
        }
    }

    public isAppendRequired(currentTime: number, bufferInfo: BufferInfo): BufferAppendRequiredResult {
        const adaptationSetsRequired = bufferInfo.activeAdaptationSets
            .map(x => {
                let nextSegmentTime: number | null = null;

                if (!x.bufferWindow.currentRange) {
                    nextSegmentTime = currentTime;
                } else {
                    const startOffset = x.bufferWindow.currentRange.start - currentTime;
                    const endOffset = x.bufferWindow.currentRange.end - currentTime;

                    // check for remove
                    if (startOffset < this.config.windowStartOffset) {
                        console.log('REMOVE REQUIRED - NOT IMPLEMENTED YET - buffer will run out of memory eventually'); // tslint:disable-line
                    }

                    // check for append
                    if (endOffset < this.config.windowEndOffset && endOffset < bufferInfo.duration) {
                        nextSegmentTime = x.bufferWindow.currentRange.end;
                    }
                }

                if (nextSegmentTime !== null) {
                    return { adaptationSet: x.adaptationSet, nextSegmentTime: Math.round(nextSegmentTime) };
                } else {
                    // console.log('buffer full, no append required');
                    return null;
                }
            })
            .filter(x => x !== null) as Array<{ adaptationSet: AdaptationSet; nextSegmentTime: number }>;

        return {
            isAppendRequired: adaptationSetsRequired.length > 0,
            adaptationSetsRequired: adaptationSetsRequired,
            duration: bufferInfo.duration,
        };
    }
}

export interface BufferSizeConfiguration {
    windowStartOffset: number;
    windowEndOffset: number;
}

interface BufferAppendRequiredResult {
    isAppendRequired: boolean;
    adaptationSetsRequired: Array<{ adaptationSet: AdaptationSet; nextSegmentTime: number }>;
    duration: number;
}
