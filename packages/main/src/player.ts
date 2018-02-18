export interface LoadOptions {
    url: string;
}

export class Player {
    constructor(private videoElement: HTMLVideoElement) {

    }
    public load(options: LoadOptions): void {
        this.videoElement.src = options.url;
        this.videoElement.load();
        this.videoElement.play();
    }

    public pause(): void {
        this.videoElement.pause();
    }

    public resume(): void {
        this.videoElement.play();
    }

    public stop(): void {
        this.videoElement.src = null;
        this.videoElement.load();
    }

    public setPosition(position: number): void {
        this.videoElement.currentTime = position;
    }
}
