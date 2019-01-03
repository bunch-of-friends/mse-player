import { AnalyticsData, BaseAnalyticsManager } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { EventEmitter } from './event-emitter';
export class AnalyticsManager extends BaseAnalyticsManager {
    private readonly analyticsEmitters = new Array<EventEmitter<AnalyticsData>>();
    private readonly analyticsSubject = createSubject<AnalyticsData>();
    public readonly onAnalyticsUpdate = createObservable(this.analyticsSubject);

    public registerAnalyticsEmitter(analyticsEmitter: EventEmitter<AnalyticsData>) {
        analyticsEmitter.onEvent.register((data: any) => {
            this.analyticsSubject.notifyObservers({
                source: analyticsEmitter.sourceName,
                data: data.data,
            });
        });
    }

    public dispose() {
        this.analyticsEmitters.forEach(e => e.onEvent.unregisterAllObservers());
        this.analyticsEmitters.length = 0;
        this.onAnalyticsUpdate.unregisterAllObservers();
    }
}
