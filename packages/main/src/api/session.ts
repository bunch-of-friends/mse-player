import { SessionOptions, Session } from './types';
import { SessionController } from '../engine/session-controller';

export function createSession(sessionController: SessionController): Session {
    return {
        onError: sessionController.onError,
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
