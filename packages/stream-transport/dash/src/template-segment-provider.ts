import { SegmentProvider, HttpHandler, SegmentAcquisition } from '@mse-player/core';

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(
        private assetDuration: number,
        private initTemplate: string,
        private mediaTemplate: string,
        private absoluteUrl: string,
        private id: string,
        private httpHandler: HttpHandler
    ) {}

    public getInitSegment(): Promise<SegmentAcquisition> {
        const url = `${this.absoluteUrl}${this.initTemplate.replace('$RepresentationID$', this.id).replace('$RepresentationID$', this.id)}`;
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(nextSegmentStartTime: number): Promise<SegmentAcquisition> {
        if (nextSegmentStartTime >= this.assetDuration) {
            return Promise.resolve(SegmentAcquisition.notAvailable());
        }

        const segmentDuration = 4;
        const segmentNumber = Math.ceil(nextSegmentStartTime / segmentDuration) + 1;
        const isLastSegment = nextSegmentStartTime + segmentDuration >= this.assetDuration;
        const segmentLength = isLastSegment ? this.assetDuration - nextSegmentStartTime : segmentDuration;
        const segmentEndTime = nextSegmentStartTime + segmentLength;

        const url = `${this.absoluteUrl}${this.mediaTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Number$', segmentNumber.toString())}`;

        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, segmentLength, segmentEndTime);
    }

    private processSegmentResponse(request: Promise<ArrayBuffer>, segmentLength: number, segmentEndTime: number): Promise<SegmentAcquisition> {
        return request
            .then(data => {
                return SegmentAcquisition.success({
                    data,
                    length: segmentLength,
                    segmentEndTime: segmentEndTime,
                });
            })
            .catch(e => {
                return SegmentAcquisition.error({
                    payload: e,
                });
            });
    }
}
