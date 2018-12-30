import { createObservable, createSubject, Observable } from '@bunch-of-friends/observable';
import { SessionError } from '../api/session';

export class SessionErrorManager {
    private errorEmitters = new Array<ErrorEmitter>();
    private errorSubject = createSubject<SessionError>();
    public onError = createObservable(this.errorSubject);

    public registerErrorEmitter(errorEmitter: ErrorEmitter) {
        errorEmitter.onError.register(error => {
            if (error.severity !== InternalErrorSeverity.Error) {
                console.log('WARNING >> ', error); //tslint:disable-line
                return;
            }

            this.errorSubject.notifyObservers({
                source: errorEmitter.name,
                error: error.error,
            });
        });
        this.errorEmitters.push(errorEmitter);
    }

    public dispose() {
        this.errorEmitters.forEach(x => x.onError.unregisterAllObservers());
        this.errorEmitters = [];
        this.onError.unregisterAllObservers();
    }
}

export interface ErrorEmitter {
    name: string;
    onError: Observable<InternalError>;
}

export interface InternalError {
    error: Object | string | null;
    severity: InternalErrorSeverity;
}

export enum InternalErrorSeverity {
    Warning,
    Error,
}
