import { Observable, Observer, createObservable, createSubject } from '@bunch-of-friends/observable';
import { Logger, StreamTransport, Abr } from '@mse-player/core';
import { SessionOptions } from '../api/session';

export interface SessionError {
    source: string;
    message?: string;
    errorObject?: Object | undefined | null;
}

export enum SessionState {
    Created = 'created',
    Loading = 'loading',
    Playing = 'playing',
    Paused = 'paused',
    Stalled = 'stalled',
    Stopped = 'stopped',
}

export class SessionController {
    private stateSubject = createSubject<SessionState>({ initialState: SessionState.Created });
    private errorSubject = createSubject<SessionError>();
    private disposeSubject = createSubject<void>();

    public onError = createObservable(this.errorSubject);

    constructor(private videoElement: HTMLVideoElement, private logger: Logger, private streamTransport: StreamTransport, private abr: Abr) {
        this.subscribeToVideoElementErrors(videoElement);
    }

    public load(options: SessionOptions): void {
        // ...
    }

    public dispose(): Promise<void> {
        return this.disposeSubject.notifyObservers().then(() => {
            this.disposeSubject.unregisterAllObservers();
            this.errorSubject.unregisterAllObservers();
        });
    }

    private subscribeToVideoElementErrors(videoElement: HTMLVideoElement) {
        const onVideoElementError = () => {
            this.errorSubject.notifyObservers({ source: 'videoElement', errorObject: this.videoElement.error });
        };
        videoElement.addEventListener('error', onVideoElementError);
        this.disposeSubject.registerObserver(() => {
            this.videoElement.removeEventListener('error', onVideoElementError);
        }, this);
    }
}
