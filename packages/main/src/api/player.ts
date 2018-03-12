import { SessionOptions, Session, createSession } from './session';

export interface Player {
    startSession(sessionOptions: SessionOptions): Session;
    dispose(): Promise<void>;
}

export function createPlayer(videoElement: HTMLVideoElement): Player {
    let currentSession: Session | null = null;

    return {
        startSession(sessionOptions: SessionOptions) {
            currentSession = createSession(sessionOptions, videoElement);
            return currentSession;
        },
        dispose() {
            if (!currentSession) {
                return Promise.resolve();
            } else {
                return currentSession.stop().then(() => {
                    currentSession = null;
                });
            }
        }
    }
}