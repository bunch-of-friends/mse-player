
import { Observable } from '../src/events/observable';
import { Observer } from '../src/events/observer';

describe('Observable', () => {
    const callbacksOwner = {};
    let observable: Observable<any>;

    beforeEach(() => {
        observable = new Observable<any>();
    });

    describe('registerObserver & notifyObservers', () => {
        it('should call the observer when notified', () => {
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data');

            expect(observer).toHaveBeenCalledTimes(1);
            expect(observer.mock.calls[0][0]).toBe('data');
        });

        it('should notify with current and previous state', () => {
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data');
            observable.notifyObservers('new-data');

            expect(observer).toHaveBeenCalledTimes(2);
            expect(observer.mock.calls[0][0]).toBe('data');
            expect(observer.mock.calls[0][1]).toBe(null);
            expect(observer.mock.calls[1][0]).toBe('new-data');
            expect(observer.mock.calls[1][1]).toBe('data');
        });

        it('should call the observer multiple times when notified multiple times', () => {
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data1');
            observable.notifyObservers('data2');

            expect(observer).toHaveBeenCalledTimes(2);
            expect(observer.mock.calls[0][0]).toBe('data1');
            expect(observer.mock.calls[1][0]).toBe('data2');
        });

        it('should call multiple observers when notified', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            observable.registerObserver(observer1, callbacksOwner);
            observable.registerObserver(observer2, callbacksOwner);

            observable.notifyObservers('data');

            expect(observer1).toHaveBeenCalledTimes(1);
            expect(observer1.mock.calls[0][0]).toBe('data');
            expect(observer2).toHaveBeenCalledTimes(1);
            expect(observer2.mock.calls[0][0]).toBe('data');
        });

        it('should call multiple observers multiple times when notified multiple times', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            observable.registerObserver(observer1, callbacksOwner);
            observable.registerObserver(observer2, callbacksOwner);

            observable.notifyObservers('data1');
            observable.notifyObservers('data2');

            expect(observer1).toHaveBeenCalledTimes(2);
            expect(observer1.mock.calls[0][0]).toBe('data1');
            expect(observer1.mock.calls[1][0]).toBe('data2');
            expect(observer2).toHaveBeenCalledTimes(2);
            expect(observer2.mock.calls[0][0]).toBe('data1');
            expect(observer2.mock.calls[1][0]).toBe('data2');
        });

        it('should notify on same value change with default options', () => {
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data');
            observable.notifyObservers('data');

            expect(observer).toHaveBeenCalledTimes(2);
            expect(observer.mock.calls[0][0]).toBe('data');
            expect(observer.mock.calls[1][0]).toBe('data');
        });

        it('should not notify on same value change if options.shouldNotifyOnlyIfNewStateDiffers set to true', () => {
            observable = new Observable<any>({ shouldNotifyOnlyIfNewStateDiffers: true });
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data');
            observable.notifyObservers('data');
            observable.notifyObservers('data');
            observable.notifyObservers('data');
            observable.notifyObservers('data');

            expect(observer).toHaveBeenCalledTimes(1);
            expect(observer).toHaveBeenCalledWith('data', null);
        });

        it('should notify if the state changed if options.shouldNotifyOnlyIfNewStateDiffers set to true', () => {
            observable = new Observable<any>({ shouldNotifyOnlyIfNewStateDiffers: true });
            const observer = jest.fn();
            observable.registerObserver(observer, callbacksOwner);

            observable.notifyObservers('data');
            observable.notifyObservers('data');
            observable.notifyObservers('data');
            observable.notifyObservers('data');

            observable.notifyObservers('new-data');
            observable.notifyObservers('new-data');
            observable.notifyObservers('new-data');

            expect(observer).toHaveBeenCalledTimes(2);
            expect(observer.mock.calls[0][0]).toBe('data');
            expect(observer.mock.calls[1][0]).toBe('new-data');
        });
    });

    describe('unregisterObserver', () => {
        it('should unregister the observer whilst keeping other observers in tact', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            observable.registerObserver(observer1, callbacksOwner);
            observable.registerObserver(observer2, callbacksOwner);

            observable.notifyObservers('data1');

            expect(observer1).toBeCalledWith('data1', null);
            expect(observer2).toBeCalledWith('data1', null);

            observer1.mockClear();
            observable.unregisterObserver(observer1);
            observable.notifyObservers('data2');

            expect(observer1).not.toBeCalled();
            expect(observer2).toHaveBeenLastCalledWith('data2', 'data1');

            observer2.mockClear();
            observable.unregisterObserver(observer2);
            observable.notifyObservers('data3');

            expect(observer1).not.toBeCalled();
            expect(observer2).not.toBeCalled();
        });
    });

    describe('unregisterObserversOfOwner', () => {
        it('should unregister the all observers of the provided owner', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            observable.registerObserver(observer1, callbacksOwner);
            observable.registerObserver(observer2, callbacksOwner);

            observable.notifyObservers('data1');

            expect(observer1).toHaveBeenCalledWith('data1', null);
            expect(observer2).toHaveBeenCalledWith('data1', null);

            observable.unregisterObserversOfOwner(callbacksOwner);

            observer1.mockClear();
            observer2.mockClear();

            observable.notifyObservers('data2');

            expect(observer1).not.toBeCalled();
            expect(observer2).not.toBeCalled();
        });

        it('should only unregister observers of the provided owner', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            const owner1 = { id: 1 };
            const owner2 = { id: 2 };
            observable.registerObserver(observer1, owner1);
            observable.registerObserver(observer2, owner2);

            observable.notifyObservers('data1');

            expect(observer1).toHaveBeenCalledWith('data1', null);
            expect(observer2).toHaveBeenCalledWith('data1', null);

            observable.unregisterObserversOfOwner(owner1);

            observer1.mockClear();
            observer2.mockClear();

            observable.notifyObservers('data2');

            expect(observer1).not.toBeCalled();
            expect(observer2).toHaveBeenCalledWith('data2', 'data1');
        });
    });

    describe('unregisterAllObservers', () => {
        it('should unregister all observers', () => {
            const observer1 = jest.fn();
            const observer2 = jest.fn();
            observable.registerObserver(observer1, callbacksOwner);
            observable.registerObserver(observer2, callbacksOwner);

            observable.notifyObservers('data1');

            expect(observer1).toHaveBeenCalledWith('data1', null);
            expect(observer2).toHaveBeenCalledWith('data1', null);

            observable.unregisterAllObservers();

            observer1.mockClear();
            observer2.mockClear();

            observable.notifyObservers('data2');

            expect(observer1).not.toBeCalled();
            expect(observer2).not.toBeCalled();
        });
    });

    describe('currentState', () => {
        it('should return curren state', () => {
            observable.notifyObservers('data1');
            expect(observable.currentState).toBe('data1');

            observable.notifyObservers('data2');
            expect(observable.currentState).toBe('data2');
        });

        it('should set initial state provided in options otherwise should be null', () => {
            const observable1 = new Observable<any>();
            expect(observable1.currentState).toBe(null);

            const observable2 = new Observable<any>({ initialState: 'initial'});
            expect(observable2.currentState).toBe('initial');
        });
    });
});
