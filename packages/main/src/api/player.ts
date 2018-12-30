import { PlayerController } from '../engine/player-controller';
import { SessionOptions, Session } from './session';

export function createPlayer(videoElement: HTMLVideoElement): Player {
    const playerController = new PlayerController(videoElement);

    return {
        startSession(sessionOptions: SessionOptions): Session {
            return playerController.startSession(sessionOptions);
        },
    };
}

export interface Player {
    startSession(sessionOptions: SessionOptions): Session;
}
