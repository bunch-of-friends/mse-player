import { Observable } from '@bunch-of-friends/observable';

export interface SessionOptions {
    url: string;
    autoPlay: boolean;
    position: number;
}

export interface Session {
    pause(): void;
    play(): void;
    seek(position: number): void;
    stop(): Promise<void>;
}

export function createSession(sessionOptions: SessionOptions, videoElement: HTMLVideoElement): Session {

    videoElement.src = sessionOptions.url;
    videoElement.autoplay = sessionOptions.autoPlay;
    videoElement.currentTime = sessionOptions.position;

    videoElement.load();

    return {
        pause() {
            videoElement.pause();
        },
        play() {
            if (videoElement.paused) {
                videoElement.play(); // TODO: handle promise
            }
        },
        seek(position: number) {
            videoElement.currentTime = position;
        },
        stop() {
            videoElement.src = '';
            videoElement.load();
            return Promise.resolve();
        }
    };
}
