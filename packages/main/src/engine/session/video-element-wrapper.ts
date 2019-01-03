import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { StreamPosition } from '../../api/session';
import { ErrorEmitter } from './session-error-manager';
import { MediaState } from './session-state-manager';

export class VideoElementWrapper {
    private readonly errorEmitter: VideoElementErrorEmitter;
    private readonly positionUpdateSubject = createSubject<StreamPosition>();
    private readonly mediaStateSubject = createSubject<MediaState>();
    public readonly onPositionUpdate = createObservable(this.positionUpdateSubject);
    public readonly onMediaStateChanged = createObservable(this.mediaStateSubject);

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
    }

    public getErrorEmitter(): ErrorEmitter {
        return this.errorEmitter;
    }

    public setSource(sourceUrl: string): void {
        this.videoElement.src = sourceUrl;
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
}

class VideoElementErrorEmitter extends ErrorEmitter {
    constructor(private videoElement: HTMLVideoElement) {
        super('videoElement');
        this.videoElement.addEventListener('error', this.onVideoElementError);
    }

    public dispose(): void {
        this.videoElement.removeEventListener('error', this.onVideoElementError);
    }

    private onVideoElementError = (): void => {
        this.notifyError({ payload: this.videoElement.error });
    };
}
