import { Player, Session, createPlayer, isSupported } from '@mse-player/main';

let player: Player | null;
let session: Session | null;

init();

function init() {
    if (!isSupported()) {
        alert('MSE not supported');
    } else {
        player = createPlayer(document.getElementById('video') as HTMLVideoElement);
        wireUpButtons();
    }
}

function wireUpButtons() {
    const loadButton = document.getElementById('load') as HTMLButtonElement;
    loadButton.onclick = function() {
        if (!player) {
            return;
        }

        session = player.startSession({
            url: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            autoPlay: true,
            position: 0,
        });
        loadButton.disabled = true;
    };

    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    stopButton.onclick = function() {
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
