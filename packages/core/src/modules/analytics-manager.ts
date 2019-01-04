import { EventEmitterBase } from './event-emitter';
import { HttpHandlerResponseMetadata } from './http-handler';

export interface AnalyticsManagerBase {
    registerAnalyticsEmitter(emitter: EventEmitterBase<HttpHandlerResponseMetadata>): void;
    dispose(): void;
}
