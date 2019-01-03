import { StreamInfo, AdaptationSet, AdaptationSetType, Segment, Representation, InternalError } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { getMimeCodec } from '../../helpers/mime-helper';
import { EventEmitter } from '../../common/event-emitter';
import { unwrap } from '../../helpers/unwrap';

export class MediaSourceWrapper {
    private isDisposed = false;
    private bufferOpenSubject = createSubject();
    private mediaSource = new MediaSource();
    private sourceBuffers = new Map<AdaptationSet, SourceBufferRecord>();
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

            this.sourceBuffers.set(r.adaptationSet, {
                currentCodec: representationMimeCodec,
                sourceBuffer: sourceBufferCreationResult.sourceBuffer,
                listeners: sourceBufferCreationResult.listeners,
            });
        }
    }

    public appendSegment(adaptationSet: AdaptationSet, representation: Representation, segment: Segment): void {
        if (this.isDisposed) {
            return;
        }

        if (this.mediaSource.readyState !== 'open') {
            this.errorEmitter.notifyEvent({ payload: 'media source not open' });
            this.dispose();
            return;
        }

        const sourceBufferRecord = unwrap(this.sourceBuffers.get(adaptationSet));
        const mimeCodec = getMimeCodec(adaptationSet, representation);

        if (sourceBufferRecord.currentCodec !== mimeCodec) {
            // INFO: TS doesn't know about the changeType fn
            (sourceBufferRecord.sourceBuffer as any).changeType(mimeCodec);
        }

        if (sourceBufferRecord.sourceBuffer.updating) {
            throw 'source buffer is currently updating';
        }
        sourceBufferRecord.sourceBuffer.appendBuffer(segment.data);
    }

    public dispose() {
        this.isDisposed = true;
        this.mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen);
        this.mediaSource.removeEventListener('sourcended', this.onMediaSourceEnded);
        this.mediaSource.removeEventListener('sourceclose', this.onMediaSourceClosed);

        this.sourceBuffers.forEach(s => {
            if (s.sourceBuffer != null) {
                for (let i = 0; i < s.listeners.length; i++) {
                    const listener = s.listeners[i];
                    s.sourceBuffer.removeEventListener(listener.event, listener.fn);
                }
            }
        });

        this.sourceBuffers.clear();
    }

    private onMediaSourceOpen = () => {
        this.mediaSource.duration = this.streamInfo.duration;
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
}

interface SourceBufferRecord {
    currentCodec: string;
    sourceBuffer: SourceBuffer;
    listeners: Array<EventListenerRecord>;
}

interface EventListenerRecord {
    event: string;
    fn: EventListener;
}
