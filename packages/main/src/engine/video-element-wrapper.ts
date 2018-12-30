import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { SessionPosition } from '../api/session';
import { ErrorEmitter, InternalError, InternalErrorSeverity } from './session-error-manager';

export class VideoElementWrapper {
    private errorEmitter: VideoElementErrorEmitter;
    private positionUpdateSubject = createSubject<SessionPosition>();
    public onPositionUpdate = createObservable(this.positionUpdateSubject);

    constructor(private videoElement: HTMLVideoElement) {
        this.errorEmitter = new VideoElementErrorEmitter(videoElement);

        this.videoElement.ontimeupdate = () => {
            this.positionUpdateSubject.notifyObservers({ currentTime: this.videoElement.currentTime });
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
        return new Promise(resolve => {
            const observer = this.positionUpdateSubject.registerObserver(() => {
                if (this.videoElement.currentTime === 0) {
                    this.positionUpdateSubject.unregisterObserver(observer);
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
}

class VideoElementErrorEmitter implements ErrorEmitter {
    private errorSubject = createSubject<InternalError>();

    public onError = createObservable(this.errorSubject);
    public name: 'videoElement';

    constructor(private videoElement: HTMLVideoElement) {
        this.videoElement.addEventListener('error', this.onVideoElementError);
    }

    public dispose(): void {
        this.videoElement.removeEventListener('error', this.onVideoElementError);
    }

    private onVideoElementError = (): void => {
        this.errorSubject.notifyObservers({ error: this.videoElement.error, severity: InternalErrorSeverity.Error });
    };
}
