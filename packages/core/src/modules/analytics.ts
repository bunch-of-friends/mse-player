import { EventEmitterBase } from './event-emitter';

export abstract class BaseAnalyticsManager {
    constructor(protected videoElement: HTMLVideoElement) {}

    public abstract registerAnalyticsEmitter(emitter: EventEmitterBase<AnalyticsData>): void;
}

export interface AnalyticsData {
    source: string;
    data: any;
}
