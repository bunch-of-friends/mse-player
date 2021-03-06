import { Observable } from '@bunch-of-friends/observable';
import { SessionController } from '../engine/session/session-controller';

export function createSession(sessionController: SessionController): Session {
    return {
        onError: sessionController.onError,
        onStateChanged: sessionController.onStateChanged,
        onPositionUpdate: sessionController.onPositionUpdate,

        seek(time: number): void {
            sessionController.seek(time);
        },

        pause(): void {
            sessionController.pause();
        },
        resume(): void {
            sessionController.play();
        },
        stop(): Promise<void> {
            return sessionController.stop();
        },
    };
}

export interface SessionOptions {
    url: string;
    autoPlay: boolean;
    startingPosition: number;
}

export interface Session {
    onError: Observable<SessionError>;
    onStateChanged: Observable<SessionState>;
    onPositionUpdate: Observable<StreamPosition>;
    seek(time: number): void;
    pause(): void;
    resume(): void;
    stop(): Promise<void>;
}

export interface SessionError {
    source: string;
    payload?: Object | string | null;
}

export interface StreamPosition {
    currentTime: number;
}

export enum SessionState {
    Created,
    ManifestLoadingStarted,
    ManifestLoadingEnded,
    InitialBufferingStarted,
    InitialBufferingEnded,
    Playing,
    Paused,
    Stalled,
    Seeking,
    StreamEnded,
    Stopping,
    Stopped,
}
