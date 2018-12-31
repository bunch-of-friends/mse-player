import { SegmentProvider, HttpHandler, SegmentAquisition } from '@mse-player/core';

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private assetDuration: number, private httpHandler: HttpHandler) {}

    public getInitSegment(): Promise<SegmentAquisition> {
        const url = 'http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_0.m4v';
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(nextSegmentStartTime: number): Promise<SegmentAquisition> {
        if (nextSegmentStartTime >= this.assetDuration) {
            return Promise.resolve(SegmentAquisition.notAvailable());
        }

        const segmentDuration = 4;
        const segmentNumber = Math.ceil(nextSegmentStartTime / segmentDuration) + 1;
        const isLastSegment = nextSegmentStartTime + segmentDuration >= this.assetDuration;
        const segmentLength = isLastSegment ? this.assetDuration - nextSegmentStartTime : segmentDuration;
        const segmentEndTime = nextSegmentStartTime + segmentLength;

        const url = `http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_1920x1080_8000k/bbb_30fps_1920x1080_8000k_${segmentNumber}.m4v`;
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, segmentLength, segmentEndTime);
    }

    private processSegmentResponse(request: Promise<ArrayBuffer>, segmentLength: number, segmentEndTime: number): Promise<SegmentAquisition> {
        return request
            .then(data => {
                return SegmentAquisition.success({
                    data,
                    length: segmentLength,
                    segmentEndTime: segmentEndTime,
                });
            })
            .catch(e => {
                return SegmentAquisition.error({
                    payload: e,
                });
            });
    }
}
