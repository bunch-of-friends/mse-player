import { InternalError } from '@mse-player/core';
import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { SessionError } from '../api/session';
import { EventEmitter } from './event-emitter';
export class SessionErrorManager {
    private readonly errorEmitters = new Array<EventEmitter<InternalError>>();
    private readonly errorSubject = createSubject<SessionError>();
    public readonly onError = createObservable(this.errorSubject);

    public registerErrorEmitter(errorEmitter: EventEmitter<InternalError>) {
        errorEmitter.onEvent.register((error: any) => {
            this.errorSubject.notifyObservers({
                source: errorEmitter.sourceName,
                payload: error.payload,
            });
        });
        this.errorEmitters.push(errorEmitter);
    }

    public dispose() {
        this.errorEmitters.forEach(x => x.onEvent.unregisterAllObservers());
        this.errorEmitters.length = 0;
        this.onError.unregisterAllObservers();
    }
}
