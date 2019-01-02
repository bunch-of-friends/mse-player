import { Observable } from '@bunch-of-friends/observable';
import { SessionController } from '../engine/session-controller';

export function createSession(sessionController: SessionController): Session {
    function isValidState(): boolean {
        const currentState = sessionController.onStateChanged.getCurrentState();
        return currentState !== SessionState.Stopped && currentState !== SessionState.Stopping;
    }

    return {
        onError: sessionController.onError,
        onStateChanged: sessionController.onStateChanged,
        onPositionUpdate: sessionController.onPositionUpdate,

        pause(): void {
            if (isValidState) {
                sessionController.pause();
            }
        },
        resume(): void {
            if (isValidState) {
                sessionController.play();
            }
        },
        stop(): Promise<void> {
            if (!isValidState) {
                return Promise.reject('session already stopped');
            }
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
