export interface EventEmitterBase<T> {
    sourceName: string;
    notifyEvent(evt: T): void;
}
