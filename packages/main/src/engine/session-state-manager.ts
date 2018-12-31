import { createSubject, createObservable, Observable } from '@bunch-of-friends/observable';
import { SessionState } from '../api/session';
import { StreamDescriptor, ManifestAquisition } from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';

export class SessionStateManager {
    private readonly stateSubject = createSubject<SessionState>({ initialState: SessionState.Created });
    public readonly onStateChanged = createObservable(this.stateSubject);

    constructor(private videoElementWrapper: VideoElementWrapper) {
        this.stateSubject.notifyObservers(SessionState.Created);
        videoElementWrapper.onMediaStateChanged.register(state => {
            switch (state) {
                case MediaState.Playing:
                    this.stateSubject.notifyObservers(SessionState.Playing);
                    break;
                case MediaState.Paused:
                    this.stateSubject.notifyObservers(SessionState.Paused);
                    break;
                case MediaState.Seeking:
                    this.stateSubject.notifyObservers(SessionState.Seeking);
                    break;
                case MediaState.Stalled:
                    this.stateSubject.notifyObservers(SessionState.Stalled);
                    break;
                case MediaState.Ended:
                    this.stateSubject.notifyObservers(SessionState.Ended);
                    break;

                default:
                    throw 'uknown media state: ' + state;
            }
        });
    }

    public async decorateLoadManifest(loadManifestFn: () => Promise<ManifestAquisition>): Promise<ManifestAquisition> {
        return this.executeStateChange(SessionState.ManifestLoadingStarted, SessionState.ManifestLoaded, loadManifestFn);
    }

    public async decorateInitialBuffering(startBufferingFn: () => Promise<void>): Promise<void> {
        return this.executeStateChange(SessionState.InitialBufferingStarted, SessionState.InitialBufferFilled, startBufferingFn);
    }

    public dispose() {
        this.videoElementWrapper.onMediaStateChanged.unregisterAllObservers();
    }

    private async executeStateChange<T>(entryState: SessionState, endState: SessionState, getResult: () => T): Promise<T> {
        this.stateSubject.notifyObservers(entryState);
        const result = await getResult();
        this.stateSubject.notifyObservers(endState);
        return result;
    }
}

export enum MediaState {
    Playing,
    Seeking,
    Paused,
    Stalled,
    Ended,
}
