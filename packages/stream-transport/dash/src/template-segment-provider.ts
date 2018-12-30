import { SegmentProvider, HttpHandler, Segment } from '@mse-player/core';

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private assetDuration: number, private httpHandler: HttpHandler) {}

    public getInitSegment(): Promise<ArrayBuffer | null> {
        return this.httpHandler.getArrayBuffer(
            'http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_0.m4v'
        );
    }
    public getNextSegment(nextSegmentStartTime: number): Promise<Segment | null> {
        if (nextSegmentStartTime >= this.assetDuration) {
            return Promise.resolve(null);
        }

        const segmentDuration = 4;
        const segmentNumber = Math.ceil(nextSegmentStartTime / segmentDuration) + 1;
        const isLastSegment = nextSegmentStartTime + segmentDuration >= this.assetDuration;
        const length = isLastSegment ? this.assetDuration - nextSegmentStartTime : segmentDuration;

        return this.httpHandler
            .getArrayBuffer(`http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_${segmentNumber}.m4v`)
            .then(data => {
                return {
                    data,
                    length: length,
                    segmentEndTime: nextSegmentStartTime + length,
                };
            });
    }
}
