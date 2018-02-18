export interface LoadOptions {
    url: string;
}
export declare class Player {
    private videoElement;
    constructor(videoElement: HTMLVideoElement);
    load(options: LoadOptions): void;
    pause(): void;
    resume(): void;
    stop(): void;
    setPosition(position: number): void;
}
