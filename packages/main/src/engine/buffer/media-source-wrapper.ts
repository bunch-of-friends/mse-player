import { StreamInfo, AdaptationSet, AdaptationSetType, Segment, Representation, InternalError, unwrap } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { getMimeCodec } from '../../helpers/mime-helper';
import { EventEmitter } from '../../common/event-emitter';

export class MediaSourceWrapper {
    private isDisposed = false;
    private bufferOpenSubject = createSubject();
    private mediaSource = new MediaSource();
    private sourceBuffersMap = new Map<AdaptationSet, SourceBufferRecord>();
    public onBufferOpen = createObservable(this.bufferOpenSubject);

    constructor(private readonly errorEmitter: EventEmitter<InternalError>, private readonly streamInfo: StreamInfo) {
        this.mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen);
        this.mediaSource.addEventListener('sourcended', this.onMediaSourceEnded);
        this.mediaSource.addEventListener('sourceclose', this.onMediaSourceClosed);
    }

    public getSourceUrl(): string {
        return URL.createObjectURL(this.mediaSource);
    }

    public getBufferDuration(): number {
        return this.mediaSource.duration;
    }

    public initialiseSources(startingRepresentations: Array<{ adaptationSet: AdaptationSet; representation: Representation }>): void {
        for (let i = 0; i < startingRepresentations.length; i++) {
            const r = startingRepresentations[i];
            const adaptationMimeCodec = getMimeCodec(r.adaptationSet);
            if (!MediaSource.isTypeSupported(adaptationMimeCodec)) {
                this.errorEmitter.notifyEvent({ payload: 'codec not supported: ' + adaptationMimeCodec });
                this.dispose();
                return;
            }

            const representationMimeCodec = getMimeCodec(r.adaptationSet, r.representation);
            const sourceBufferCreationResult = this.createSourceBuffer(representationMimeCodec);
            if (!sourceBufferCreationResult) {
                this.dispose();
                return;
            }

            this.sourceBuffersMap.set(r.adaptationSet, {
                currentCodec: representationMimeCodec,
                sourceBuffer: sourceBufferCreationResult.sourceBuffer,
                currentAppendPromise: null,
                listeners: sourceBufferCreationResult.listeners,
            });
        }
    }

    public async appendSegment(
        adaptationSet: AdaptationSet,
        representation: Representation,
        segment: Segment,
        requestedSegmentTime: number,
        isInitSegment = false
    ): Promise<void> {
        if (this.isDisposed) {
            return Promise.reject();
        }

        if (this.mediaSource.readyState !== 'open') {
            this.errorEmitter.notifyEvent({ payload: 'media source not open' });
            this.dispose();
            return Promise.reject();
        }

        const sourceBufferRecord = unwrap(this.sourceBuffersMap.get(adaptationSet));
        const mimeCodec = getMimeCodec(adaptationSet, representation);

        if (sourceBufferRecord.currentCodec !== mimeCodec) {
            // INFO: TS doesn't know about the changeType fn
            (sourceBufferRecord.sourceBuffer as any).changeType(mimeCodec);
        }

        if (sourceBufferRecord.currentAppendPromise) {
            await sourceBufferRecord.currentAppendPromise;
        }

        sourceBufferRecord.currentAppendPromise = new Promise(resolve => {
            if (sourceBufferRecord.sourceBuffer.updating) {
                throw 'source buffer is currently updating';
            }

            const onUpdateEnd = () => {
                sourceBufferRecord.sourceBuffer.removeEventListener('updateend', onUpdateEnd);
                resolve();
            };

            sourceBufferRecord.sourceBuffer.addEventListener('updateend', onUpdateEnd);
            sourceBufferRecord.sourceBuffer.appendBuffer(segment.bytes);
        });

        await sourceBufferRecord.currentAppendPromise;
        if (!isInitSegment) {
            this.validateAppendedSegment(sourceBufferRecord, requestedSegmentTime);
        }
    }

    public dispose() {
        this.isDisposed = true;
        this.mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen);
        this.mediaSource.removeEventListener('sourcended', this.onMediaSourceEnded);
        this.mediaSource.removeEventListener('sourceclose', this.onMediaSourceClosed);

        this.sourceBuffersMap.forEach(s => {
            if (s.sourceBuffer != null) {
                for (let i = 0; i < s.listeners.length; i++) {
                    const listener = s.listeners[i];
                    s.sourceBuffer.removeEventListener(listener.event, listener.fn);
                }
            }
        });

        this.sourceBuffersMap.clear();
    }

    public getBufferInfo(currentTime: number): BufferInfo {
        // find active buffers
        const activeSourceBuffers = new Array<SourceBuffer>();
        for (let i = 0; i < this.mediaSource.sourceBuffers.length; i++) {
            activeSourceBuffers.push(this.mediaSource.sourceBuffers[i]);
        }

        // for each active buffer calculate current window
        const activeAdaptationSets = activeSourceBuffers
            .map(sourceBuffer => {
                return {
                    sourceBuffer,
                    bufferWindow: this.calculateCurrentWindow(sourceBuffer, currentTime),
                };
            })
            // for each active buffer find adaptation set
            .map(x => {
                return {
                    adaptationSet: this.findAdapdationSet(x.sourceBuffer),
                    bufferWindow: x.bufferWindow,
                };
            });

        return {
            duration: this.mediaSource.duration,
            activeAdaptationSets,
        };
    }

    private findAdapdationSet(sourceBuffer: SourceBuffer): AdaptationSet {
        let result: AdaptationSet | null = null;
        this.sourceBuffersMap.forEach((r, a) => {
            if (result) {
                return;
            }

            if (r.sourceBuffer === sourceBuffer) {
                result = a;
            }
        });

        if (!result) {
            throw 'adaptation set not found for sourceBuffer: ' + sourceBuffer;
        }

        return result;
    }

    private calculateCurrentWindow(sourceBuffer: SourceBuffer, currentTime: number): BufferWindow {
        const allRanges = [];
        let activeRange: Range | null = null;
        let length = sourceBuffer.buffered.length;
        while (length-- > 0) {
            const index = length;
            const start = sourceBuffer.buffered.start(index);
            const end = sourceBuffer.buffered.end(index);

            if (start <= currentTime && currentTime <= end) {
                activeRange = { start, end };
            }

            allRanges.push({ start, end });
        }

        return {
            currentRange: activeRange,
            allRanges,
        };
    }

    private onMediaSourceOpen = () => {
        if (this.streamInfo.duration) {
            this.mediaSource.duration = this.streamInfo.duration;
        }
        this.bufferOpenSubject.notifyObservers();
    };

    private onMediaSourceEnded = () => {
        console.log('mediaSource ended'); // tslint:disable-line
    };

    private onMediaSourceClosed = () => {
        console.log('mediaSource closed'); // tslint:disable-line
    };

    private createSourceBuffer(mimeCodec: string): { sourceBuffer: SourceBuffer; listeners: Array<EventListenerRecord> } | null {
        try {
            console.log('creating source buffer for: ' + mimeCodec);
            const sourceBuffer = this.mediaSource.addSourceBuffer(mimeCodec);

            const onError = () => {
                this.errorEmitter.notifyEvent({ payload: 'sourceBuffer error, mimeCodec: ' + mimeCodec });
                this.dispose();
            };
            sourceBuffer.addEventListener('error', onError);
            return {
                sourceBuffer,
                listeners: [{ event: 'error', fn: onError }],
            };
        } catch (error) {
            this.errorEmitter.notifyEvent({ payload: error });
            return null;
        }
    }

    private validateAppendedSegment(sourceBufferRecord: SourceBufferRecord, requestedSegmentTime: number) {
        const updatedWindow = this.calculateCurrentWindow(sourceBufferRecord.sourceBuffer, requestedSegmentTime);
        if (
            updatedWindow.currentRange &&
            updatedWindow.currentRange.start <= requestedSegmentTime &&
            requestedSegmentTime < updatedWindow.currentRange.end
        ) {
            // all good
        } else {
            throw `invalid buffer update for ${sourceBufferRecord.currentCodec}, position: ${requestedSegmentTime}, ranges: ${JSON.stringify(
                updatedWindow.allRanges
            )}`;
        }
    }
}

export interface BufferInfo {
    duration: number;
    activeAdaptationSets: Array<{ adaptationSet: AdaptationSet; bufferWindow: BufferWindow }>;
}

export interface BufferWindow {
    currentRange: Range | null;

    allRanges: Array<Range>;
}

interface Range {
    start: number;
    end: number;
}

interface SourceBufferRecord {
    currentCodec: string;
    sourceBuffer: SourceBuffer;
    currentAppendPromise: Promise<void> | null;
    listeners: Array<EventListenerRecord>;
}

interface EventListenerRecord {
    event: string;
    fn: EventListener;
}
