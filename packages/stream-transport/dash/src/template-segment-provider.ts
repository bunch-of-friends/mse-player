import { SegmentProvider, HttpHandlerBase, Acquisition, Segment } from '@mse-player/core';

export interface TemplateSegmentInfo {
    assetDuration: number | null;
    initTemplate: string;
    mediaTemplate: string;
    type: string;
    absoluteUrl: string;
    timescale: number;
    segmentDurations: Array<{ delta: number, repeats: number }>;
}

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private segmentInfo: TemplateSegmentInfo, private id: string, private bandwidth: number, private httpHandler: HttpHandlerBase) {}

    public getInitSegment(): Promise<Acquisition<Segment>> {
        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.initTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Bandwidth$', `${this.bandwidth}`)
            .replace('$Time$', '0')}`;
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(requestedSegmentTime: number): Promise<Acquisition<Segment>> {
        if (this.segmentInfo.assetDuration === null) {
            throw 'assetDuration is null, linearStreams not supported yet';
        }

        if (requestedSegmentTime > this.segmentInfo.assetDuration) {
            throw 'requested time is higher that asset duration';
        }

        const segmentDuration = this.getSegmentDuration(Math.round(requestedSegmentTime * this.segmentInfo.timescale)) / this.segmentInfo.timescale;
        const segmentNumber = Math.ceil(requestedSegmentTime / segmentDuration) + 1;
        // console.log('seg', segmentDuration, segmentNumber)
        // const isLastSegment = requestedSegmentTime + segmentDuration >= this.segmentInfo.assetDuration;
        // const segmentLength = isLastSegment ? this.segmentInfo.assetDuration - requestedSegmentTime : segmentDuration;
        const segmentEndTime = requestedSegmentTime + segmentDuration;

        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.mediaTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Number$', segmentNumber.toString())
            .replace('$Bandwidth$', `${this.bandwidth}`)
            .replace('$Time$', `${Math.round(requestedSegmentTime * this.segmentInfo.timescale)}`)}`;

        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, segmentDuration, segmentEndTime);
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

    private getSegmentDuration(segmentStartTime: number) {
        let pointer = 0;

        const segmentDurationData = this.segmentInfo.segmentDurations.find((segmentDuration, index) => {
            const endOfDurationValiditity = pointer + segmentDuration.delta * segmentDuration.repeats;
            if (segmentStartTime < endOfDurationValiditity) {
                if (segmentDuration.repeats === 1) {
                console.log('FOUND AT INDEX', index, segmentStartTime)
                }
                return true;
            } else {
                pointer = endOfDurationValiditity;
                return false;
            }
        });
        // console.log('CURRENT SEG DURATION', segmentDurationData && segmentDurationData.delta)
        return (segmentDurationData && segmentDurationData.delta) || 1;
    }
}
