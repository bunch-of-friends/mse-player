import { Observable } from '@bunch-of-friends/observable';
import { SessionController } from '../engine/session-controller';

export function createSession(sessionController: SessionController): Session {
    return {
        onError: sessionController.onError,
        onStateChanged: sessionController.onStateChanged,
        onPositionUpdate: sessionController.onPositionUpdate,
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
    onPositionUpdate: Observable<SessionPosition>;
    pause(): void;
    resume(): void;
    stop(): Promise<void>;
}

export interface SessionError {
    source: string;
    payload?: Object | string | null;
}

export interface SessionPosition {
    currentTime: number;
}

export enum SessionState {
    Created,
    ManifestLoadingStarted,
    ManifestLoaded,
    InitialBufferingStarted,
    InitialBufferFilled,
    Playing,
    Paused,
    Stalled,
    Seeking,
    Ended,
}
