import { SegmentProvider, HttpHandlerBase, Acquisition, Segment } from '@mse-player/core';

export interface TemplateSegmentMetadata {
    assetDuration: number | null;
    initTemplate: string;
    mediaTemplate: string;
    type: string;
    absoluteUrl: string;
    timescale: number;
    segmentDurations: Array<{ delta: number; repeats: number }>;
}

export class TemplateSegmentProvider implements SegmentProvider {
    constructor(private segmentMetadata: TemplateSegmentMetadata, private id: string, private bandwidth: number, private httpHandler: HttpHandlerBase) {}

    public getInitSegment(): Promise<Acquisition<Segment>> {
        const url = this.generateUrl(this.segmentMetadata.initTemplate, 0, 0);
        const request = this.httpHandler.getArrayBuffer(url);
        return this.processSegmentResponse(request, 0, 0);
    }

    public getNextSegment(requestedSegmentTimeSeconds: number): Promise<Acquisition<Segment>> {
        if (this.segmentMetadata.assetDuration === null) {
            throw 'assetDuration is null, linearStreams not supported yet';
        }

        if (requestedSegmentTimeSeconds > this.segmentMetadata.assetDuration) {
            throw 'requested time is higher that asset duration';
        }

        const requestedSegmentTimeFixed = Math.ceil(requestedSegmentTimeSeconds * 1000) / 1000; // TODO: we need a better solution to the loss of precision when normalising times :(

        const requestedSegmentTimeNormalised = Math.round(requestedSegmentTimeFixed * this.segmentMetadata.timescale);

        const { segmentStart, segmentDuration, segmentIndex, segmentEnd } = this.getSegmentInformation(requestedSegmentTimeNormalised);

        const url = this.generateUrl(this.segmentMetadata.mediaTemplate, segmentIndex, segmentStart);

        const request = this.httpHandler.getArrayBuffer(url);

        return this.processSegmentResponse(request, segmentDuration / this.segmentMetadata.timescale, segmentEnd / this.segmentMetadata.timescale);
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

    private generateUrl(relativePath: string, segmentIndex: number, segmentStart: number) {
        return `${this.segmentMetadata.absoluteUrl}${relativePath
            .replace(/\$RepresentationID\$/g, this.id)
            .replace(/\$Number\$/g, `${segmentIndex}`)
            .replace(/\$Bandwidth\$/g, `${this.bandwidth}`)
            .replace(/\$Time\$/g, `${segmentStart}`)}`;
    }

    // Finds the segment info for an arbitrary point in the stream
    private getSegmentInformation(segmentStartTime: number) {
        let segmentStart = 0;
        let segmentIndex = 0;
        // TODO: could be more efficient
        const segmentInfo = this.segmentMetadata.segmentDurations.find(segmentDurationData => {
            for (let i = 0; i < segmentDurationData.repeats; i++) {
                const newSegmentStart = segmentStart + segmentDurationData.delta;
                segmentIndex++;
                if (segmentStartTime < newSegmentStart) {
                    return true;
                }
                segmentStart = newSegmentStart;
            }
            return false;
        });

        const segmentDuration = (segmentInfo && segmentInfo.delta) || 1;
        return {
            segmentStart,
            segmentEnd: segmentStart + segmentDuration,
            segmentIndex,
            segmentDuration,
        };
    }
}
