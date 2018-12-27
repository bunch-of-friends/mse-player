import { SessionOptions, Session } from './types';
import { SessionController } from '../engine/session-controller';

export function createSession(sessionOptions: SessionOptions, sessionController: SessionController): Session {
    return {
        onError: sessionController.onError,
        pause(): void {
            sessionController.pause();
        },
        resume(): void {
            sessionController.resume();
        },
        stop(): Promise<void> {
            return sessionController.dispose();
        },
    };
}
