export interface Stream {
    tracks: Array<Track>;
}
export interface Track {
    type: TrackType;
}
export declare enum TrackType {
    Video = "video",
    Audio = "audio",
    Text = "text",
}
