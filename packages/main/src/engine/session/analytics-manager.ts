import { AnalyticsManagerBase, HttpHandlerResponseMetadata } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { EventEmitter } from '../../common/event-emitter';
import { VideoElementWrapper } from './video-element-wrapper';

export class AnalyticsManager implements AnalyticsManagerBase {
    private readonly analyticsEmitters = new Array<EventEmitter<HttpHandlerResponseMetadata>>();
    private readonly videoPlaybackQuality: VideoPlaybackQuality;
    private readonly sessionStartedEpoch: number;
    private readonly analyticsSubject = createSubject<HttpHandlerResponseMetadata>();
    public readonly onAnalyticsUpdate = createObservable(this.analyticsSubject);
    constructor(videoElementWrapper: VideoElementWrapper) {
        this.sessionStartedEpoch = Date.now();
        this.videoPlaybackQuality = videoElementWrapper.getVideoPlaybackQuality();
        window.setTimeout(() => {
            // console.log('VIDEO PLAYBACK ---->', this.videoPlaybackQuality);
        }, 5000);
    }

    public registerAnalyticsEmitter(analyticsEmitter: EventEmitter<HttpHandlerResponseMetadata>) {
        analyticsEmitter.onEvent.register((data: HttpHandlerResponseMetadata) => {
            // console.log('DATA RECEIVED --->', data);
            // this.analyticsSubject.notifyObservers({
            //     source: analyticsEmitter.sourceName,
            //     data: data.data,
            // });
        });

        this.analyticsEmitters.push(analyticsEmitter);
    }

    public dispose() {
        this.analyticsEmitters.forEach(e => e.onEvent.unregisterAllObservers());
        this.analyticsEmitters.length = 0;
        this.onAnalyticsUpdate.unregisterAllObservers();
    }

    private parseAnalyticsData(source: string, data: HttpHandlerResponseMetadata) {

    }
}
