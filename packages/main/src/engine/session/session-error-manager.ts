import { InternalError } from '@mse-player/core';
import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { SessionError } from '../../api/session';

export class SessionErrorManager {
    private readonly errorEmitters = new Array<ErrorEmitter>();
    private readonly errorSubject = createSubject<SessionError>();
    public readonly onError = createObservable(this.errorSubject);

    public registerErrorEmitter(errorEmitter: ErrorEmitter) {
        errorEmitter.onError.register(error => {
            this.errorSubject.notifyObservers({
                source: errorEmitter.souceName,
                payload: error.payload,
            });
        });
        this.errorEmitters.push(errorEmitter);
    }

    public dispose() {
        this.errorEmitters.forEach(x => x.onError.unregisterAllObservers());
        this.errorEmitters.length = 0;
        this.onError.unregisterAllObservers();
    }
}

export class ErrorEmitter {
    private readonly errorSubject = createSubject<InternalError>();

    public readonly onError = createObservable(this.errorSubject);
    constructor(public readonly souceName: string) {}
    public notifyError(error: InternalError) {
        this.errorSubject.notifyObservers(error);
    }
}
