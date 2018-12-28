import { HttpHandler, StreamTransport, StreamDescriptor, AdaptationSetType, SegmentProvider, Segment } from '@mse-player/core';
import { parse } from 'mpd-parser';

export class DashStreamTransport extends StreamTransport {
    public getStreamDescriptor(): Promise<StreamDescriptor> {
        return this.httpHandler.getString(this.manifestUrl).then(response => {
            const mpdManifest = parse(response, this.manifestUrl);
            return this.createStreamDescriptor(mpdManifest);
        });
    }

    private createStreamDescriptor(mpdManifest: any): StreamDescriptor {
        const durationMs = mpdManifest.duration * 1000;
        return {
            isLive: false,
            durationMs,
            adaptationSets: [
                {
                    type: AdaptationSetType.Video,
                    mimeType: 'video/mp4',
                    representations: [
                        {
                            codecs: 'avc1.640028',
                            id: 'bbb_30fps_1920x1080_8000k',
                            bandwidth: 9914554,
                            segmentProvider: new DashSegmentTemplateSegmentProvider(durationMs, this.httpHandler),
                        },
                    ],
                },
            ],
        };
    }
}

class DashSegmentTemplateSegmentProvider implements SegmentProvider {
    constructor(private assetDurationMs: number, private httpHandler: HttpHandler) {}

    public getInitSegment(): Promise<ArrayBuffer | null> {
        return this.httpHandler.getArrayBuffer(
            'http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_0.m4v'
        );
    }
    public getNextSegment(nextSegmentStartTimeMs: number): Promise<Segment | null> {
        if (nextSegmentStartTimeMs >= this.assetDurationMs) {
            return Promise.resolve(null);
        }

        const segmentDurationMs = 4000;
        const segmentNumber = Math.max(1, Math.ceil(nextSegmentStartTimeMs / segmentDurationMs));
        const isLastSegment = nextSegmentStartTimeMs + segmentDurationMs >= this.assetDurationMs;
        const lengthMs = isLastSegment ? this.assetDurationMs - nextSegmentStartTimeMs : segmentDurationMs;

        return this.httpHandler
            .getArrayBuffer(`http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_${segmentNumber}.m4v`)
            .then(data => {
                return {
                    data,
                    lengthMs,
                    segmentEndTimeMs: nextSegmentStartTimeMs + lengthMs,
                };
            });
    }
}
