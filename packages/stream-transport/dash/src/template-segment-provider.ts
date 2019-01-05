import { SegmentProvider, HttpHandlerBase, Acquisition, Segment } from '@mse-player/core';

export interface TemplateSegmentInfo {
    assetDuration: number | null;
    initTemplate: string;
    mediaTemplate: string;
    type: string;
    absoluteUrl: string;
}

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private segmentInfo: TemplateSegmentInfo, private id: string, private httpHandler: HttpHandlerBase) {}

    public getInitSegment(): Promise<Acquisition<Segment>> {
        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.initTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)}`;
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(lastSegmentEndTime: number): Promise<Acquisition<Segment>> {
        if (this.segmentInfo.assetDuration === null) {
            throw 'assetDuration is null, linearStreams not supported yet';
        }

        if (lastSegmentEndTime >= this.segmentInfo.assetDuration) {
            throw 'requested time is higher that asset duration';
        }

        const segmentDuration = 4;
        const segmentNumber = Math.ceil(lastSegmentEndTime / segmentDuration) + 1;
        const isLastSegment = lastSegmentEndTime + segmentDuration >= this.segmentInfo.assetDuration;
        const segmentLength = isLastSegment ? this.segmentInfo.assetDuration - lastSegmentEndTime : segmentDuration;
        const segmentEndTime = lastSegmentEndTime + segmentLength;

        console.log('requesting segment ', this.id, lastSegmentEndTime, '->', segmentNumber);

        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.mediaTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Number$', segmentNumber.toString())}`;

        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, segmentLength, segmentEndTime);
    }

    private processSegmentResponse(request: Promise<ArrayBuffer>, segmentLength: number, segmentEndTime: number): Promise<Acquisition<Segment>> {
        return request
            .then(bytes => {
                return Acquisition.success({
                    bytes,
                });
            })
            .catch(e => {
                return Acquisition.error({
                    payload: e,
                });
            });
    }
}
