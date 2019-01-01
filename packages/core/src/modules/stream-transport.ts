import { HttpHandler } from './http-handler';
import { InternalError } from './internal-error';

export interface StreamTransportCtr {
    new (manifestUrl: string, httpHandler: HttpHandler): StreamTransport;
}

export abstract class StreamTransport {
    constructor(protected manifestUrl: string, protected httpHandler: HttpHandler) {}

    public abstract getStreamDescriptor(): Promise<ManifestAcquisition>;
}

export interface ManifestAcquisition {
    isSuccess: boolean;
    streamDescriptor?: StreamDescriptor;
    error?: InternalError;
}

export interface StreamDescriptor {
    streamInfo: StreamInfo;
    adaptationSets: Array<AdaptationSet>;
}

export interface StreamInfo {
    isLive: boolean;
    duration: number;
}

export interface SegmentProvider {
    getInitSegment(): Promise<SegmentAcquisition>;
    getNextSegment(nextSegmentStartTime: number): Promise<SegmentAcquisition>;
}

export interface Segment {
    data: ArrayBuffer;
    length: number;
    segmentEndTime: number;
}

export class SegmentAcquisition {
    public static success(segment: Segment): SegmentAcquisition {
        return {
            isNotAvailable: false,
            isSuccess: true,
            isError: false,
            segment,
        };
    }

    public static error(error: InternalError): SegmentAcquisition {
        return {
            isNotAvailable: false,
            isSuccess: false,
            isError: true,
            error,
        };
    }

    public static notAvailable(): SegmentAcquisition {
        return {
            isNotAvailable: true,
            isSuccess: false,
            isError: false,
        };
    }

    public readonly isNotAvailable: boolean;
    public readonly isSuccess: boolean;
    public readonly isError: boolean;

    public segment?: Segment;
    public error?: InternalError;
}

export interface SegmentProvider {
    getInitSegment(): Promise<SegmentAquisition>;
    getNextSegment(nextSegmentStartTime: number): Promise<SegmentAquisition>;
}

export interface Segment {
    data: ArrayBuffer;
    length: number;
    segmentEndTime: number;
}

export class SegmentAquisition {
    public static success(segment: Segment): SegmentAquisition {
        return {
            isNotAvailable: false,
            isSuccess: true,
            isError: false,
            segment,
        };
    }

    public static error(error: InternalError): SegmentAquisition {
        return {
            isNotAvailable: false,
            isSuccess: false,
            isError: true,
            error,
        };
    }

    public static notAvailable(): SegmentAquisition {
        return {
            isNotAvailable: true,
            isSuccess: false,
            isError: false,
        };
    }

    public readonly isNotAvailable: boolean;
    public readonly isSuccess: boolean;
    public readonly isError: boolean;

    public segment?: Segment;
    public error?: InternalError;
}

export enum AdaptationSetType {
    Video = 'video',
    Audio = 'audio',
}

export interface AdaptationSet {
    type: AdaptationSetType;
    mimeType: string;
    representations: Array<Representation>;
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
