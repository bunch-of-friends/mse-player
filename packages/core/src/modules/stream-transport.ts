import { HttpHandler } from './http-handler';

export interface StreamTransportCtr {
    new (manifestUrl: string, httpHandler: HttpHandler): StreamTransport;
}

export abstract class StreamTransport {
    constructor(protected manifestUrl: string, protected httpHandler: HttpHandler) {}

    public abstract getStreamDescriptor(): Promise<StreamDescriptor>;
}

export interface StreamDescriptor {
    isLive: boolean;
    durationMs: number;
    adaptationSets: Array<AdaptationSet>;
}

export enum AdaptationSetType {
    Video = 'video',
    Audio = 'audio',
}

export interface AdaptationSet {
    type: AdaptationSetType;
    mimeType: string;
    representations: Array<VideoRepresentation> | Array<AudioRepresentation>;
}

export interface Representation {
    id: string;

    codecs: string;
    bandwidth: number;
    segmentProvider: SegmentProvider;
}

export interface VideoRepresentation extends Representation {
    width?: number;
    height?: number;
    frameRate?: number;
}

export interface AudioRepresentation extends Representation {
    channels?: number;
    samplingRate?: number;
}

export interface SegmentProvider {
    getInitSegment(): Promise<ArrayBuffer | null>;
    getNextSegment(nextSegmentStartTime: number): Promise<Segment | null>;
}

export interface Segment {
    data: ArrayBuffer;
    lengthMs: number;
    segmentEndAbsoluteMs: number;
}
