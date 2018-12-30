import { StreamDescriptor, Abr, AdaptationSetType, AdaptationSet, VideoRepresentation, Segment } from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';

export class BufferController {
    private readonly videoAdaptationSet: AdaptationSet;
    private readonly streamDescriptor: StreamDescriptor;

    constructor(private videoElementWrapper: VideoElementWrapper, streamDescriptor: StreamDescriptor, private abr: Abr) {
        this.streamDescriptor = streamDescriptor;
        this.videoAdaptationSet = this.streamDescriptor.adaptationSets.filter(x => x.type === AdaptationSetType.Video)[0];
        if (!this.videoAdaptationSet) {
            throw 'no video adaptation sets found';
        }
    }

    public startFillingBuffer(startingPositionMs: number): void {
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

    private appendInitSegment(sourceBuffer: SourceBuffer): Promise<void> {
        const representation = this.abr.getNextSegmentRepresentation(this.videoAdaptationSet);
        return representation.segmentProvider.getInitSegment().then(bytes => {
            if (bytes !== null) {
                sourceBuffer.appendBuffer(bytes);
            }
        });
    }

    private appendNextSegment(nextSegmentStartPositionMs: number, sourceBuffer: SourceBuffer): Promise<Segment | null> {
        const representation = this.abr.getNextSegmentRepresentation(this.videoAdaptationSet);
        return representation.segmentProvider.getNextSegment(nextSegmentStartPositionMs).then(segment => {
            if (segment !== null) {
                sourceBuffer.appendBuffer(segment.data);
            }
            return segment;
        });
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
}
