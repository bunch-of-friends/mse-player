import { Player, Session, createPlayer } from '@mse-player/main';

const player = createPlayer(document.getElementById('video') as HTMLVideoElement);
wireUpButtons();

let session: Session | null;

export function wireUpButtons() {
    const loadButton = document.getElementById('load') as HTMLButtonElement;
    loadButton.onclick = function () {
        session = player.startSession({ url: 'https://www.quirksmode.org/html5/videos/big_buck_bunny.mp4', autoPlay: true, position: 0 });
        loadButton.disabled = true;
    };

    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    stopButton.onclick = function () {
        if (!session) {
            return;
        }
        session.stop().then(() => {
            loadButton.disabled = false;
        });
    };

    const pauseButton = document.getElementById('pause') as HTMLButtonElement;
    pauseButton.onclick = function() {
        if (!session) {
            return;
        }
        session.pause();
    };

    const resumeButton = document.getElementById('resume') as HTMLButtonElement;
    resumeButton.onclick = function() {
        if (!session) {
            return;
        }
        session.play();
    };
}
