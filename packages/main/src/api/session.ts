import { Observable, createObserverContext, ObserverContext, createObserverContextForValue } from '@mse-player/core';
import { Player } from './player';

export interface SessionOptions {

}

export enum PlayerState {
    Stopped,
    Loading,
    Playing,
    Paused,
    Rebuffering,
    Finished
}

export class Session {

    private stateObservable = new Observable<PlayerState>();
    public onStateChanged = createObserverContext(this.stateObservable);
    public onFinished = createObserverContextForValue(this.stateObservable, PlayerState.Finished);

    constructor(sessionLoadOptios: SessionOptions) {
        // WIP...

        const x = this.onFinished.register(() => {
            this.onFinished.unregister(x);
        });
    }
}
