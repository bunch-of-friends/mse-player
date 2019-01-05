import { Segment, Abr, AdaptationSet, Representation, InternalError, unwrap, Acquisition } from '@mse-player/core';

export class SegmentAcquisitionManager {
    private readonly initSegmentMap = new Map<Representation, Segment>();

    constructor(private abr: Abr) {}

    public getStartingRepresentation(adapdationSet: AdaptationSet): Representation {
        return this.abr.getStartingRepresentation(adapdationSet);
    }

    public async acquireSegment(
        adapdationSet: AdaptationSet,
        lastSegmentEndTime: number
    ): Promise<Acquisition<{ initSegment: Segment | null; segment: Segment; representation: Representation }>> {
        const representation = this.abr.getNextSegmentRepresentation(adapdationSet);
        const alreadyHasInitSegment = this.initSegmentMap.has(representation);
        if (!alreadyHasInitSegment) {
            try {
                await this.acquireInitSegment(representation);
            } catch (e) {
                return Acquisition.error(e);
            }
        }

        const acquisition = await representation.segmentProvider.getNextSegment(lastSegmentEndTime);
        if (!acquisition.isSuccess) {
            return Acquisition.error(acquisition.error);
        } else {
            return Acquisition.success({
                initSegment: !alreadyHasInitSegment ? unwrap(this.initSegmentMap.get(representation)) : null,
                segment: acquisition.payload,
                representation,
            });
        }
    }

    public getAdapdationSets(): Array<AdaptationSet> {
        return this.abr.getAdaptationSets();
    }

    private async acquireInitSegment(representation: Representation): Promise<void> {
        const initSegmentAcquisition = await representation.segmentProvider.getInitSegment();
        if (initSegmentAcquisition.isSuccess) {
            this.initSegmentMap.set(representation, initSegmentAcquisition.payload);
        } else {
            return Promise.reject(initSegmentAcquisition.error);
        }
    }
}
