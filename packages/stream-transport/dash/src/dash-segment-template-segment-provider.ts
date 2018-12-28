import { SegmentProvider, HttpHandler, Segment } from '@mse-player/core';

export class DashSegmentTemplateSegmentProvider implements SegmentProvider {
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
