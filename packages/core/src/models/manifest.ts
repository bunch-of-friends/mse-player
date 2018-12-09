export interface Manifest {
    codec: string;
    tracks: Array<ManifestTrack>;
}

export enum ManifestTrackType {
    Video = 'video',
    Audio = 'audio',
    Text = 'text',
}

export interface ManifestTrack {
    type: ManifestTrackType;
}
