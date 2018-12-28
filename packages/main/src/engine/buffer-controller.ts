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

    public setStartingPosition(positionMs: number): void {
        this.initialiseSource(positionMs);
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

    private async appendAllSegments(startingPositionMs: number, durationMs: number, sourceBuffer: SourceBuffer): Promise<void> {
        let currentBufferEndMs = startingPositionMs;
        while (currentBufferEndMs <= durationMs) {
            const nextSegment = await this.appendNextSegment(currentBufferEndMs, sourceBuffer);
            if (!nextSegment) {
                return;
            }
            currentBufferEndMs = nextSegment.segmentEndTimeMs;
        }
    }

    private initialiseSource(positionMs: number) {
        const mediaSource = new MediaSource();
        this.videoElementWrapper.setSource(URL.createObjectURL(mediaSource));

        mediaSource.addEventListener('sourceopen', () => {
            console.log('mediaSource open');

            const videoRepresentatons = this.videoAdaptationSet.representations as Array<VideoRepresentation>;
            const mimeCodec = this.videoAdaptationSet.mimeType + ';codecs="' + videoRepresentatons.map(x => x.codecs).join(',') + '"';
            if (!MediaSource.isTypeSupported(mimeCodec)) {
                throw 'mimeCodec not supported: ' + mimeCodec;
            }

            const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);

            sourceBuffer.addEventListener('error', () => {
                console.log('sourceBuffer error');
            });
            sourceBuffer.addEventListener('updatstart', () => {
                console.log('sourceBuffer update start');
            });
            sourceBuffer.addEventListener('update', () => {
                console.log('sourceBuffer update');
            });
            sourceBuffer.addEventListener('updatended', () => {
                console.log('sourceBuffer update ended');
            });

            this.appendInitSegment(sourceBuffer).then(() => {
                this.appendAllSegments(positionMs, this.streamDescriptor.durationMs, sourceBuffer);
            });
        });

        mediaSource.addEventListener('sourcended', () => {
            console.log('mediaSource ended');
        });

        mediaSource.addEventListener('sourceclose', () => {
            console.log('mediaSource close');
        });
    }
}
