export abstract class Analytics {
    constructor(private videoElement: HTMLVideoElement) {}

    public abstract getLatestPlayoutData(): {};
}
