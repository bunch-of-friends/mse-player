import { StreamInfo, AdaptationSet, AdaptationSetType, Segment, Representation, InternalError } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { getMimeCodec } from '../../helpers/mime-helper';
import { EventEmitter } from '../../common/event-emitter';

export class MediaSourceWrapper {
    private isDisposed = false;
    private bufferOpenSubject = createSubject();
    private mediaSource = new MediaSource();
    private sourceBuffers = new Map<AdaptationSet, SourceBufferRecord>();
    public onBufferOpen = createObservable(this.bufferOpenSubject);

    constructor(
        private readonly errorEmitter: EventEmitter<InternalError>,
        private readonly streamInfo: StreamInfo,
        adaptationSets: Array<AdaptationSet>
    ) {
        this.mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen);
        this.mediaSource.addEventListener('sourcended', this.onMediaSourceEnded);
        this.mediaSource.addEventListener('sourceclose', this.onMediaSourceClosed);

        for (let i = 0; i < adaptationSets.length; i++) {
            const adaptation = adaptationSets[i];
            const mimeCodec = getMimeCodec(adaptation);
            if (!MediaSource.isTypeSupported(mimeCodec)) {
                this.errorEmitter.notifyEvent({ payload: 'codec not supported: ' + mimeCodec });
                this.dispose();
                return;
            }

            this.sourceBuffers.set(adaptation, { currentCodec: '', sourceBuffer: null, listeners: [] });
        }
    }

    public getSourceUrl(): string {
        return URL.createObjectURL(this.mediaSource);
    }

    public getBufferDuration(): number {
        return this.mediaSource.duration;
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

        const sourceBufferHolder = this.sourceBuffers.get(adaptationSet);
        if (!sourceBufferHolder) {
            this.errorEmitter.notifyEvent({ payload: 'sourcebuffer not found for adaptation set, mimeType: ' + adaptationSet.mimeType });
            this.dispose();
            return;
        }

        const mimeCodec = getMimeCodec(adaptationSet, representation);
        if (!sourceBufferHolder.sourceBuffer) {
            const sourceBufferCreationResult = this.createSourceBuffer(mimeCodec);
            if (!sourceBufferCreationResult) {
                this.dispose();
                return;
            }
            sourceBufferHolder.sourceBuffer = sourceBufferCreationResult.sourceBuffer;
            sourceBufferHolder.listeners.concat(sourceBufferCreationResult.listeners);
            sourceBufferHolder.currentCodec = mimeCodec;
        } else if (sourceBufferHolder.currentCodec !== mimeCodec) {
            // INFO: TS doesn't know about the changeType fn
            (sourceBufferHolder.sourceBuffer as any).changeType(mimeCodec);
        }

        sourceBufferHolder.sourceBuffer.appendBuffer(segment.data);
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
    sourceBuffer: SourceBuffer | null;
    listeners: Array<EventListenerRecord>;
}

interface EventListenerRecord {
    event: string;
    fn: EventListener;
}
