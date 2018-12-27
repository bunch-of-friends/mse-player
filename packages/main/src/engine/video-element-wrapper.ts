import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { SessionError } from '../api/types';

export class VideoElementWrapper {
    private errorSubject = createSubject<SessionError>();
    public onError = createObservable(this.errorSubject);

    constructor(private videoElement: HTMLVideoElement) {
        videoElement.addEventListener('error', this.onVideoElementError);
    }

    public pause(): void {
        this.videoElement.pause();
    }

    public resume(): void {
        this.videoElement.play();
    }

    public dispose(): void {
        this.videoElement.removeEventListener('error', this.onVideoElementError);
    }

    private onVideoElementError = (): void => {
        this.errorSubject.notifyObservers({ source: 'videoElement', errorObject: this.videoElement.error });
    };
}
