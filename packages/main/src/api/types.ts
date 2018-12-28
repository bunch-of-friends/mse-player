import { Observable } from '@bunch-of-friends/observable';

export interface Player {
    startSession(sessionOptions: SessionOptions): Session;
}

export interface SessionOptions {
    url: string;
    autoPlay: boolean;
    position: number;
}

export interface Session {
    onError: Observable<SessionError>;
    pause(): void;
    resume(): void;
    stop(): Promise<void>;
}

export interface SessionError {
    source: string;
    message?: string;
    errorObject?: Object | undefined | null;
}

export enum SessionState {
    Created = 'Created',
    ManifestLoading = 'ManifestLoading',
    InitialBuffering = 'InitialBuffering',
    Playing = 'Playing',
    Paused = 'Paused',
    Stalled = 'Stalled',
    Stopped = 'Stopped',
}
