import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { InternalError } from '@mse-player/core';
import { StreamPosition } from '../../api/session';
import { MediaState } from './session-state-manager';
import { EventEmitter } from '../../common/event-emitter';

export class VideoElementWrapper {
    private readonly errorEmitter: VideoElementErrorEmitter;
    private readonly positionUpdateSubject = createSubject<StreamPosition>();
    private readonly mediaStateSubject = createSubject<MediaState>();
    private readonly encryptedSubject = createSubject<MediaEncryptedEvent>();
    public readonly onPositionUpdate = createObservable(this.positionUpdateSubject);
    public readonly onMediaStateChanged = createObservable(this.mediaStateSubject);
    public readonly onEncryptedEvent = createObservable(this.encryptedSubject);

    constructor(private videoElement: HTMLVideoElement) {
        (window as any).video = videoElement;
        this.errorEmitter = new VideoElementErrorEmitter(videoElement);

        this.videoElement.ontimeupdate = () => {
            this.positionUpdateSubject.notifyObservers({ currentTime: this.videoElement.currentTime });
        };

        this.videoElement.onplaying = () => {
            this.mediaStateSubject.notifyObservers(MediaState.Playing);
        };

        this.videoElement.onpause = () => {
            this.mediaStateSubject.notifyObservers(MediaState.Paused);
        };

        this.videoElement.onseeking = () => {
            this.mediaStateSubject.notifyObservers(MediaState.Seeking);
        };

        this.videoElement.onwaiting = () => {
            this.mediaStateSubject.notifyObservers(MediaState.Stalled);
        };

        this.videoElement.onencrypted = (event) => {
            this.encryptedSubject.notifyObservers(event);
        };
    }

    public getErrorEmitter(): EventEmitter<InternalError> {
        return this.errorEmitter;
    }

    public setSource(sourceUrl: string): void {
        this.videoElement.src = sourceUrl;
    }

    public setPosition(time: number) {
        this.videoElement.currentTime = time;
    }

    public pause(): void {
        this.videoElement.pause();
    }

    public play(): Promise<void> {
        return this.videoElement.play();
    }

    public stop(): Promise<void> {
        const onStopped = () => {
            this.videoElement.ontimeupdate = null;
            this.videoElement.onplaying = null;
            this.videoElement.onpause = null;
            this.videoElement.onplaying = null;
            this.videoElement.onseeking = null;
            this.videoElement.onwaiting = null;

            this.onMediaStateChanged.unregisterAllObservers();
            this.onPositionUpdate.unregisterAllObservers();
        };

        return new Promise(resolve => {
            const observer = this.positionUpdateSubject.registerObserver(() => {
                if (this.videoElement.currentTime === 0) {
                    this.positionUpdateSubject.unregisterObserver(observer);
                    onStopped();
                    resolve();
                }
            }, this);

            this.pause();
            this.setSource('');
        });
    }

    public dispose(): void {
        this.errorEmitter.dispose();
    }

    public getMediaError(): MediaError | null {
        return this.videoElement.error;
    }

    public getVideoPlaybackQuality(): VideoPlaybackQuality {
        return {} as VideoPlaybackQuality;
    }

    public setMediaKeys(mediaKeys: MediaKeys) {
        return this.videoElement.setMediaKeys(mediaKeys);
    }
}

class VideoElementErrorEmitter extends EventEmitter<InternalError> {
    constructor(private videoElement: HTMLVideoElement) {
        super('videoElement');
        this.videoElement.addEventListener('error', this.onVideoElementError);
    }

    public dispose(): void {
        this.videoElement.removeEventListener('error', this.onVideoElementError);
    }

    private onVideoElementError = (): void => {
        this.notifyEvent({ payload: this.videoElement.error });
    };
}
