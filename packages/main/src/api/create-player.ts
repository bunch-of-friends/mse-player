import { Player } from '../player/';
import { createVideoElement } from '../dom/create-video-element';

const players = new Array<{ player: Player, videoElement: HTMLVideoElement }>();

export function createPlayer(targetElement: HTMLElement): Player {
    const videoElement = createVideoElement(targetElement, window.document);
    const player = new Player(videoElement);
    players.push({ player, videoElement });
    return player;
}
