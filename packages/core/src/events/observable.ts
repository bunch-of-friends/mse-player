import { Observer } from './observer';

export class Observable<T> {

    private internalCurrentState: T = null;
    private registeredObservers = new Array<{ observer: Observer<T>, owner: any }>();

    private shouldNotifyOnlyIfNewStateDiffers = false;

    public get currentState() {
        return this.internalCurrentState;
    }

    constructor(options?: { shouldNotifyOnlyIfNewStateDiffers?: boolean, initialState?: T }) {
        if (options) {
            this.shouldNotifyOnlyIfNewStateDiffers = options.shouldNotifyOnlyIfNewStateDiffers || false;
            this.internalCurrentState = options.initialState || null;
        }
    }

    public registerObserver(observer: Observer<T>, owner: Object) {
        if (observer) {
            this.registeredObservers.push({ observer, owner });
        }
    }

    public unregisterObserver(observer: Observer<T>) {
        this.registeredObservers.forEach((item, index) => {
            if (item.observer !== observer) {
                return;
            }

            this.registeredObservers.splice(index, 1);
        });
    }

    public unregisterObserversOfOwner(owner: Object): void {
        this.registeredObservers = this.registeredObservers.filter(item => item.owner !== owner);
    }

    public unregisterAllObservers(): void {
        this.registeredObservers = [];
    }

    public notifyObservers(newState?: T): void {
        if (this.shouldNotifyOnlyIfNewStateDiffers && newState === this.internalCurrentState) {
            return;
        }

        this.registeredObservers.forEach(item => item.observer(newState, this.internalCurrentState));
        this.internalCurrentState = newState;
    }
}
