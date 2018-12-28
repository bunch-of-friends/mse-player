import { isSupported } from './support-check';
import { PlayerController } from '../engine/player-controller';
import { Player, SessionOptions, Session } from './types';

export function createPlayer(videoElement: HTMLVideoElement): Player {
    if (!isSupported()) {
        throw new Error('The Media Source Extensions API is not supported.');
    }

    const playerController = new PlayerController(videoElement);

    return {
        startSession(sessionOptions: SessionOptions): Session {
            return playerController.startSession(sessionOptions);
        },
    };
}
