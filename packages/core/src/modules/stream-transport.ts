export interface StreamTransport {
    getStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor>;
}

export interface StreamDescriptor {
    isLive: boolean;
    durationMs?: number;
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
    bitrate: number;
    segmentProvider: SegmentProvider;
}

export interface VideoRepresentation extends Representation {
    width: number;
    height: number;
    frameRate?: number;
}

export interface AudioRepresentation extends Representation {
    channels: number;
    samplingRate: number;
}

export interface SegmentProvider {
    getInitSegment(): Promise<ArrayBuffer | null>;
    getNextSegment(curentTimeMs: number): Promise<ArrayBuffer>;
}
