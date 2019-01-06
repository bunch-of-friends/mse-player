import { AdaptationSet } from '@mse-player/core';
import { BufferInfo, BufferWindow } from './media-source-wrapper';

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
        // console.log('current buffer window', bufferInfo.currentBufferedWindow);

        const adaptationSetsRequired = bufferInfo.activeAdaptationSets
            .map(x => {
                const startOffset = x.bufferWindow.start - currentTime;
                const endOffset = x.bufferWindow.end - currentTime;

                if (startOffset < this.config.windowStartOffset) {
                    console.log('REMOVE REQUIRED - NOT IMPLEMENTED YET - buffer will run out of memory eventually');
                }

                if (endOffset < this.config.windowEndOffset && endOffset < bufferInfo.duration) {
                    return { adaptationSet: x.adaptationSet, nextSegmentTime: Math.round(x.bufferWindow.end) };
                } else {
                    console.log('buffer full, no append required');
                    return null;
                }
            })
            .filter(x => x !== null) as Array<{ adaptationSet: AdaptationSet; nextSegmentTime: number }>;

        return {
            isAppendRequired: adaptationSetsRequired.length > 0,
            adaptationSetsRequired: adaptationSetsRequired,
            currentBufferWindow: bufferInfo.currentBufferedWindow,
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
    currentBufferWindow: BufferWindow;
    duration: number;
}
