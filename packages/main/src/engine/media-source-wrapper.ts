import { AdaptationSet, AdaptationSetType, InternalError, StreamInfo, Segment } from '@mse-player/core';
import { getMimeCodec } from '../helpers/mime-helper';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { EventEmitter } from './event-emitter';

export class MediaSourceWrapper {
    private isDisposed = false;
    private bufferOpenSubject = createSubject();
    private mediaSource = new MediaSource();
    private videoSourceBuffer: SourceBuffer | null;
    private audioSourceBuffer: SourceBuffer | null;
    public onBufferOpen = createObservable(this.bufferOpenSubject);

    constructor(
        private eventEmitter: EventEmitter<InternalError>,
        private streamInfo: StreamInfo,
        private videoAdapdationSet: AdaptationSet,
        private audioAdaptationSet: AdaptationSet
    ) {
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

    public getCurrentBufferEnd(currentPosition: number) {
        if (!this.videoSourceBuffer || !this.audioSourceBuffer) {
            return {
                video: 0,
                audio: 0,
            };
        } else {
            return {
                video: this.videoSourceBuffer.buffered.end(this.findCurrentTimeRangeIndex(this.videoSourceBuffer.buffered, currentPosition)),
                audio: this.audioSourceBuffer.buffered.end(this.findCurrentTimeRangeIndex(this.audioSourceBuffer.buffered, currentPosition)),
            };
        }
    }

    public appendSegment(type: AdaptationSetType, segment: Segment) {
        if (this.isDisposed) {
            return;
        }

        switch (type) {
            case AdaptationSetType.Video:
                if (!this.videoSourceBuffer) {
                    throw 'videoSourceBuffer is null';
                }
                this.videoSourceBuffer.appendBuffer(segment.data);
                break;
            case AdaptationSetType.Audio:
                if (!this.audioSourceBuffer) {
                    throw 'audioSourceBuffer is null';
                }
                this.audioSourceBuffer.appendBuffer(segment.data);
                break;
            default:
                throw 'unknown type' + type;
        }
    }

    public dispose() {
        this.isDisposed = true;
        this.mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen);
        this.mediaSource.removeEventListener('sourcended', this.onMediaSourceEnded);
        this.mediaSource.removeEventListener('sourceclose', this.onMediaSourceClosed);
    }

    private onMediaSourceOpen = () => {
        this.mediaSource.duration = this.streamInfo.duration;

        const videoMimeCodec = getMimeCodec(this.videoAdapdationSet);
        const audioMimeCodec = getMimeCodec(this.audioAdaptationSet);

        if (!this.isMimeCodecSupported(videoMimeCodec) || !this.isMimeCodecSupported(audioMimeCodec)) {
            return;
        }

        this.videoSourceBuffer = this.mediaSource.addSourceBuffer(videoMimeCodec);
        // this.audioSourceBuffer = this.mediaSource.addSourceBuffer(audioMimeCodec);

        this.videoSourceBuffer.addEventListener('error', this.onVideoSourceBufferError);
        // this.audioSourceBuffer.addEventListener('error', this.onAudioSourceBufferError);

        this.bufferOpenSubject.notifyObservers();
    };

    private onMediaSourceEnded = () => {
        console.log('mediaSource ended'); // tslint:disable-line
    };

    private onMediaSourceClosed = () => {
        console.log('mediaSource closed'); // tslint:disable-line
    };

    private onVideoSourceBufferError = (e: Event) => {
        this.eventEmitter.notifyEvent({ payload: { type: 'video', event: e } });
    };

    private onAudioSourceBufferError = (e: Event) => {
        this.eventEmitter.notifyEvent({ payload: { type: 'audio', event: e } });
    };

    private isMimeCodecSupported(mimeCodec: string): boolean {
        if (!MediaSource.isTypeSupported(mimeCodec)) {
            this.eventEmitter.notifyEvent({ payload: 'mimeType or codec not supported: ' + mimeCodec });
            return false;
        } else {
            return true;
        }
    }

    private findCurrentTimeRangeIndex(timeRanges: TimeRanges, currentPosition: number): number {
        return 0;
    }
}
