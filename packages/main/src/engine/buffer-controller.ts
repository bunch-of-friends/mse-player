import {
    StreamDescriptor,
    Abr,
    AdaptationSetType,
    AdaptationSet,
    VideoRepresentation,
    Segment,
    InternalError,
    SegmentAquisition,
} from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';
import { ErrorEmitter } from './session-error-manager';

export class BufferController {
    private readonly videoAdaptationSet: AdaptationSet;
    private readonly streamDescriptor: StreamDescriptor;
    private readonly errorEmitter = new BufferErrorEmitter();
    private isInErrorState = false;

    constructor(private videoElementWrapper: VideoElementWrapper, streamDescriptor: StreamDescriptor, private abr: Abr) {
        this.streamDescriptor = streamDescriptor;
        this.videoAdaptationSet = this.streamDescriptor.adaptationSets.filter(x => x.type === AdaptationSetType.Video)[0];
        if (!this.videoAdaptationSet) {
            this.notifyError({ payload: 'no video adaptation sets found' });
        }
    }

    public startFillingBuffer(startingPositionMs: number): void {
        if (this.isInErrorState) {
            return;
        }
        this.initialiseSource(startingPositionMs, this.streamDescriptor.duration);
    }

    public pause(): void {
        // wip
    }

    public play(): void {
        // wip
    }

    public dispose(): void {
        // wip
    }

    private async appendInitSegment(sourceBuffer: SourceBuffer): Promise<void> {
        const representation = this.abr.getNextSegmentRepresentation(this.videoAdaptationSet);
        const segmentAquisition = await representation.segmentProvider.getInitSegment();

        if (segmentAquisition.isNotAvailable) {
            return;
        }

        if (segmentAquisition.isError && segmentAquisition.error) {
            this.notifyError(segmentAquisition.error);
            return;
        }

        if (segmentAquisition.isSuccess && segmentAquisition.segment) {
            sourceBuffer.appendBuffer(segmentAquisition.segment.data);
            return;
        }

        throw 'init segment - didnt expect to get here';
    }

    private async appendNextSegment(nextSegmentStartPositionMs: number, sourceBuffer: SourceBuffer): Promise<Segment | null> {
        const representation = this.abr.getNextSegmentRepresentation(this.videoAdaptationSet);
        const segmentAquisition = await representation.segmentProvider.getNextSegment(nextSegmentStartPositionMs);

        if (segmentAquisition.isNotAvailable) {
            return null;
        }

        if (segmentAquisition.isError && segmentAquisition.error) {
            this.notifyError(segmentAquisition.error);
            return null;
        }

        if (segmentAquisition.isSuccess && segmentAquisition.segment) {
            sourceBuffer.appendBuffer(segmentAquisition.segment.data);
            return segmentAquisition.segment;
        }

        throw 'segment - didnt expect to get here';
    }

    private async appendAllSegments(startingPosition: number, durationMs: number, sourceBuffer: SourceBuffer): Promise<void> {
        let currentBufferEnd = startingPosition;
        while (currentBufferEnd <= durationMs) {
            const nextSegment = await this.appendNextSegment(currentBufferEnd, sourceBuffer);
            if (!nextSegment) {
                return;
            }
            currentBufferEnd = nextSegment.segmentEndTime;
        }
    }

    private initialiseSource(positionMs: number, duration: number) {
        const mediaSource = new MediaSource();

        this.videoElementWrapper.setSource(URL.createObjectURL(mediaSource));

        mediaSource.addEventListener('sourceopen', () => {
            console.log('mediaSource open'); // tslint:disable-line

            mediaSource.duration = duration;
            (window as any).m = mediaSource;

            const videoRepresentatons = this.videoAdaptationSet.representations as Array<VideoRepresentation>;
            const mimeCodec = this.videoAdaptationSet.mimeType + ';codecs="' + videoRepresentatons.map(x => x.codecs).join(',') + '"';
            if (!MediaSource.isTypeSupported(mimeCodec)) {
                throw 'mimeCodec not supported: ' + mimeCodec;
            }

            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            (window as any).s = sourceBuffer;

            sourceBuffer.addEventListener('error', () => {
                console.log('sourceBuffer error'); // tslint:disable-line
            });
            sourceBuffer.addEventListener('updatstart', () => {
                console.log('sourceBuffer update start'); // tslint:disable-line
            });
            sourceBuffer.addEventListener('update', () => {
                console.log('sourceBuffer update'); // tslint:disable-line
            });
            sourceBuffer.addEventListener('updatended', () => {
                console.log('sourceBuffer update ended'); // tslint:disable-line
            });

            this.appendInitSegment(sourceBuffer).then(() => {
                this.appendAllSegments(positionMs, this.streamDescriptor.duration, sourceBuffer);
            });
        });

        mediaSource.addEventListener('sourcended', () => {
            console.log('mediaSource ended'); // tslint:disable-line
        });

        mediaSource.addEventListener('sourceclose', () => {
            console.log('mediaSource close'); // tslint:disable-line
        });
    }

    private notifyError(error: InternalError) {
        this.errorEmitter.notifyError(error);
        this.isInErrorState = true;
    }
}

class BufferErrorEmitter extends ErrorEmitter {
    public name: 'bufferController';
    public notifyError(error: InternalError) {
        this.errorSubject.notifyObservers(error);
    }
}
