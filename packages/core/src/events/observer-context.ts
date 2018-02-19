import { Observable, Observer } from './observable';

export interface ObserverContext<T> {
    register: (observer: Observer<T>) => Observer<T>;
    unregister: (observer: Observer<T>) => void;
    unregisterAll: () => void;
}

export function createObserverContext<T>(observable: Observable<T>): ObserverContext<T> {
    const observerOwner = {};
    return {
        register: (observer: Observer<T>) => observable.registerObserver(observer, observerOwner),
        unregister: (observer: Observer<T>) => observable.unregisterObserver(observer),
        unregisterAll: () => observable.unregisterObserversOfOwner(observerOwner)
    };
}

export function createObserverContextForValue<T>(observable: Observable<T>, value: T): ObserverContext<void> {
    const observerOwner = {};
    const registeredObserversMap = new Array<{ registeredObserver: Observer<T>, exactValueObserver: Observer<void> }>();

    function registerExactValueObserver(exactValueObserver: Observer<void>) {
        return observable.registerObserver((newValue, oldValue) => {
            if (newValue === value) {
                exactValueObserver(null, null);
            }
        }, observerOwner);
    }

    return {
        register: (exactValueObserver: Observer<void>) => {
            const registeredObserver = registerExactValueObserver(exactValueObserver);
            registeredObserversMap.push({ registeredObserver, exactValueObserver });
            return exactValueObserver;
        },
        unregister: (exactValueObserver: Observer<void>) => {
            const registeredObservers = registeredObserversMap.filter(x => x.exactValueObserver === exactValueObserver);
            if (registeredObservers) {
                registeredObservers.forEach(x => observable.unregisterObserver(x.registeredObserver));
            }
        },
        unregisterAll: () => observable.unregisterObserversOfOwner(observerOwner)
    };
}
