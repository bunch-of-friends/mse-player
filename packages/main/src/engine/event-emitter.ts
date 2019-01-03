import { createObservable, createSubject } from '@bunch-of-friends/observable';
import { EventEmitterBase } from '@mse-player/core';

export class EventEmitter<T> implements EventEmitterBase<T> {
    private readonly subject = createSubject<T>();
    public readonly onEvent = createObservable(this.subject);
    constructor(public sourceName: string) {}
    public notifyEvent(evt: T) {
        this.subject.notifyObservers(evt);
    }
}
