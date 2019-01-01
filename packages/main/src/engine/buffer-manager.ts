import { StreamDescriptor, Abr, AdaptationSetType, AdaptationSet, VideoRepresentation, Segment, InternalError, StreamInfo } from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';
import { ErrorEmitter } from './session-error-manager';
import { SegmentAcquisitionManager } from './segment-acqusition-manager';
import { unwrap } from '../helpers/unwrap';

export class BufferManager {
    private isInErrorState = false;
    private readonly errorEmitter = new ErrorEmitter('bufferController');

    private segmentAcquisitionManager: SegmentAcquisitionManager | null;
    private streamInfo: StreamInfo | null;

    constructor(private videoElementWrapper: VideoElementWrapper) {}

    public initialise(startingPositionMs: number, segmentAcquisitionManager: SegmentAcquisitionManager, streamInfo: StreamInfo): void {
        if (this.isInErrorState) {
            return;
        }
        this.segmentAcquisitionManager = segmentAcquisitionManager;
        this.streamInfo = streamInfo;
        this.initialiseSource(startingPositionMs, this.streamInfo.duration);
    }

    public getErrorEmitter(): ErrorEmitter {
        return this.errorEmitter;
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

    public onPositionUpdate(position: number) {
        console.log('buffer position update', position);
    }

    private async appendSegment(position: number, sourceBuffer: SourceBuffer, isInitSegment = false): Promise<Segment | null> {
        const segmentAcquisition = await unwrap(this.segmentAcquisitionManager).acquireSegment(AdaptationSetType.Video, position, isInitSegment);

        if (segmentAcquisition.isNotAvailable) {
            return null;
        }

        if (segmentAcquisition.isError && segmentAcquisition.error) {
            this.notifyError(segmentAcquisition.error);
            return null;
        }

        if (segmentAcquisition.isSuccess && segmentAcquisition.segment) {
            sourceBuffer.appendBuffer(segmentAcquisition.segment.data);
            return segmentAcquisition.segment;
        }

        throw 'init segment - didnt expect to get here';
    }

    private async appendAllSegments(startingPosition: number, durationMs: number, sourceBuffer: SourceBuffer): Promise<void> {
        let currentBufferEnd = startingPosition;
        while (currentBufferEnd <= durationMs) {
            const nextSegment = await this.appendSegment(currentBufferEnd, sourceBuffer);
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

            if (!this.segmentAcquisitionManager) {
                throw 'segmentAcquisitionManager is null';
            }

            mediaSource.duration = duration;
            (window as any).m = mediaSource;

            const videoAdaptationSet = this.segmentAcquisitionManager.getAdapdationSet(AdaptationSetType.Video);
            const videoRepresentatons = videoAdaptationSet.representations as Array<VideoRepresentation>;
            const mimeCodec = videoAdaptationSet.mimeType + ';codecs="' + videoRepresentatons.map(x => x.codecs).join(',') + '"';
            if (!MediaSource.isTypeSupported(mimeCodec)) {
                throw 'mimeCodec not supported: ' + mimeCodec;
            }

            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
            (window as any).s = sourceBuffer;

            sourceBuffer.addEventListener('error', () => {
                console.log('sourceBuffer error'); // tslint:disable-line
            });

            this.appendSegment(0, sourceBuffer, true).then(() => {
                this.appendAllSegments(positionMs, unwrap(this.streamInfo).duration, sourceBuffer);
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
