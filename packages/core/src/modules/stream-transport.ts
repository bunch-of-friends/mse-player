import { HttpHandlerBase } from './http-handler';
import { InternalError } from './internal-error';
import { Acquisition } from './acquisition';

export interface StreamTransportCtr {
    new (httpHandler: HttpHandlerBase): StreamTransport;
}

export abstract class StreamTransport {
    constructor(protected httpHandler: HttpHandlerBase) {}

    public abstract getStreamDescriptor(manifestUrl: string): Promise<Acquisition<StreamDescriptor>>;
}

export interface StreamDescriptor {
    streamInfo: StreamInfo;
    periods: Array<Period>;
}

export interface StreamInfo {
    isLive: boolean;
    duration: number | null;
}

export interface Segment {
    bytes: ArrayBuffer;
}

export interface SegmentProvider {
    getInitSegment(): Promise<Acquisition<Segment>>;
    getNextSegment(lastSegmentEndTime: number): Promise<Acquisition<Segment>>;
}

export enum AdaptationSetType {
    Video = 'video',
    Audio = 'audio',
}

export enum MimeType {
    Video = 'video/mp4',
    Audio = 'audio/mp4',
}

export interface Period {
    adaptationSets: Array<AdaptationSet>;
}

export interface AdaptationSet {
    type: AdaptationSetType;
    mimeType: string;
    representations: Array<VideoRepresentation | AudioRepresentation>;
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
