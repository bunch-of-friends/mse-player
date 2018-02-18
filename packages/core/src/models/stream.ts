export interface Stream {
    tracks: Array<Track>;
}

export interface Track {
    type: TrackType;
}

export enum TrackType {
    Video = 'video',
    Audio = 'audio',
    Text = 'text'
}
