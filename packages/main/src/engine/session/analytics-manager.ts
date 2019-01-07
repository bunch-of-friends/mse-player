import { AnalyticsManagerBase, HttpHandlerResponseMetadata } from '@mse-player/core';
import { createSubject, createObservable } from '@bunch-of-friends/observable';
import { EventEmitter } from '../../common/event-emitter';
import { VideoElementWrapper } from './video-element-wrapper';
import { BandwidthManager } from './bandwidth-manager';

interface SessionAnalytics {
    averageBandwidth: null | number;
}
export class AnalyticsManager implements AnalyticsManagerBase {
    private readonly analyticsEmitters = new Array<EventEmitter<HttpHandlerResponseMetadata>>();
    // private readonly videoPlaybackQuality: VideoPlaybackQuality;
    private bandwidthManager = new BandwidthManager();
    constructor(videoElementWrapper: VideoElementWrapper) {
        // this.videoPlaybackQuality = videoElementWrapper.getVideoPlaybackQuality();
        // window.setTimeout(() => {
        //     console.log('VIDEO PLAYBACK ---->', this.videoPlaybackQuality);
        // }, 5000);
    }

    public registerAnalyticsEmitter(analyticsEmitter: EventEmitter<HttpHandlerResponseMetadata>) {
        analyticsEmitter.onEvent.register((data: HttpHandlerResponseMetadata) => {
            this.bandwidthManager.addToBandwidthSample(data);
            // console.log('AVERAGE BANDWIDTH ---->', this.bandwidthManager.getAverageBandwidth());
        });

        this.analyticsEmitters.push(analyticsEmitter);
    }

    public getBufferInfo() {
        return {
            avgBandwidth: this.bandwidthManager.getAverageBandwidth(),
            bufferSize: 0,
        };
    }

    public dispose() {
        this.analyticsEmitters.forEach(e => e.onEvent.unregisterAllObservers());
        this.analyticsEmitters.length = 0;
    }

    // private handleAnalyticsData(source: string, data: HttpHandlerResponseMetadata) {
    //     // this will accept multiple data types
    //     if (source === 'httpHandler') {
    //         // TODO: make this a constant
    //         const analyticsData = data as HttpHandlerResponseMetadata;
    //         return analyticsData;
    //     }
    // }
}
