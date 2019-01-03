import { PlayerController } from '../engine/player/player-controller';
import { SessionOptions, Session } from './session';

export function createPlayer(videoElementContainer: HTMLElement): Player {
    const playerController = new PlayerController(videoElementContainer);

    return {
        startSession(sessionOptions: SessionOptions): Session {
            return playerController.startSession(sessionOptions);
        },
    };
}

export interface Player {
    startSession(sessionOptions: SessionOptions): Session;
}
