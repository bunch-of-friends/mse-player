import { SessionOptions, Session, createSession } from './session';
import { isSupported } from './support-check';

export interface Player {
    startSession(sessionOptions: SessionOptions): Session;
    dispose(): Promise<void>;
}

export function createPlayer(videoElement: HTMLVideoElement): Player {
    if (!isSupported) {
        throw new Error('The Media Source Extensions API is not supported.');
    }

    let currentSession: Session | null = null;

    return {
        startSession(sessionOptions: SessionOptions): Session {
            currentSession = createSession(sessionOptions, videoElement);
            return currentSession;
        },
        dispose(): Promise<void> {
            if (!currentSession) {
                return Promise.resolve();
            } else {
                return currentSession.stop().then(() => {
                    currentSession = null;
                });
            }
        },
    };
}
