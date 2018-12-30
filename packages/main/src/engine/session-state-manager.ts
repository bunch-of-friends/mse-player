import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { SessionState } from '../api/session';
import { StreamDescriptor } from '@mse-player/core';

export class SessionStateManager {
    private stateSubject = createSubject<SessionState>({ initialState: SessionState.Created });
    public onStateChanged = createObservable(this.stateSubject);

    public async decorateLoadManifest(loadManifestFn: () => Promise<StreamDescriptor>): Promise<StreamDescriptor> {
        return this.executeStateChange(SessionState.ManifestLoadingStarted, SessionState.ManifestLoaded, loadManifestFn);
    }

    public async decorateInitialBuffering(startBufferingFn: () => Promise<void>): Promise<void> {
        return this.executeStateChange(SessionState.InitialBufferingStarted, SessionState.InitialBufferFilled, startBufferingFn);
    }

    private async executeStateChange<T>(entryState: SessionState, endState: SessionState, resultProvingFn: () => T): Promise<T> {
        this.stateSubject.notifyObservers(entryState);
        const result = await resultProvingFn();
        this.stateSubject.notifyObservers(endState);
        return result;
    }
}
