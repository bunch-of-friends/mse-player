import { Observable } from '@bunch-of-friends/observable';
import { DependencyContainer } from '@mse-player/core';
import { SessionController, SessionError } from '../engine/session-controller';

// INFO: main only depends on smooth-streaming and simple-abr temporarily for ealy stages of development
// the intention is that those should be resolved in run-time based on the user's chcoice or the stream-type
import { SmoothStreamingTransport } from '@mse-player/smooth-streaming';
import { SimpleAbr } from '@mse-player/simple-abr';

DependencyContainer.setStreamTransport(new SmoothStreamingTransport(DependencyContainer.getHttpHandler(), DependencyContainer.getLogger()));
DependencyContainer.setAbr(new SimpleAbr(DependencyContainer.getHttpHandler(), DependencyContainer.getLogger()));

// ---

export interface SessionOptions {
    url: string;
    autoPlay: boolean;
    position: number;
}

export interface Session {
    onError: Observable<SessionError>;
    pause(): void;
    play(): void;
    seek(position: number): void;
    stop(): Promise<void>;
}

export function createSession(sessionOptions: SessionOptions, videoElement: HTMLVideoElement): Session {
    const controller = new SessionController(
        videoElement,
        DependencyContainer.getLogger(),
        DependencyContainer.getStreamTransport(),
        DependencyContainer.getAbr()
    );
    controller.load(sessionOptions);

    return {
        onError: controller.onError,
        pause(): void {
            // ...
        },
        play(): void {
            // ...
        },
        seek(position: number): void {
            // ...
        },
        stop(): Promise<void> {
            // ...
            return Promise.resolve();
        },
    };
}
