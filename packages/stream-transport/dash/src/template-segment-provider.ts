import { SegmentProvider, HttpHandlerBase, SegmentAcquisition } from '@mse-player/core';

export interface TemplateSegmentInfo {
    assetDuration: number;
    initTemplate: string;
    mediaTemplate: string;
    type: string;
    absoluteUrl: string;
    timescale: number;
    segmentDurations: Array<{ delta: number, repeats: number }>;
}

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private segmentInfo: TemplateSegmentInfo, private id: string, private bandwidth: number, private httpHandler: HttpHandlerBase) {}

    public getInitSegment(): Promise<SegmentAcquisition> {
        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.initTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Bandwidth$', `${this.bandwidth}`)
            .replace('$Time$', '0')}`;
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(nextSegmentStartTime: number): Promise<SegmentAcquisition> {
        if (nextSegmentStartTime >= this.segmentInfo.assetDuration) {
            return Promise.resolve(SegmentAcquisition.notAvailable());
        }

        const segmentDuration = this.getSegmentDuration(Math.round(nextSegmentStartTime * this.segmentInfo.timescale)) / this.segmentInfo.timescale;
        const segmentNumber = Math.ceil(nextSegmentStartTime / segmentDuration) + 1;
        // console.log('seg', segmentDuration, segmentNumber)
        // const isLastSegment = nextSegmentStartTime + segmentDuration >= this.segmentInfo.assetDuration;
        // const segmentLength = isLastSegment ? this.segmentInfo.assetDuration - nextSegmentStartTime : segmentDuration;
        const segmentEndTime = nextSegmentStartTime + segmentDuration;

        const url = `${this.segmentInfo.absoluteUrl}${this.segmentInfo.mediaTemplate
            .replace('$RepresentationID$', this.id)
            .replace('$RepresentationID$', this.id)
            .replace('$Number$', segmentNumber.toString())
            .replace('$Bandwidth$', `${this.bandwidth}`)
            .replace('$Time$', `${Math.round(nextSegmentStartTime * this.segmentInfo.timescale)}`)}`;

        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, segmentDuration, segmentEndTime);
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
