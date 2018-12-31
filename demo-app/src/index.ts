import * as mse from '@mse-player/main';

const videoElement = document.getElementById('video') as HTMLVideoElement;
const infoContainer = document.getElementById('info') as HTMLDivElement;
const logContainer = document.getElementById('log') as HTMLDivElement;

let player: mse.Player | null;
let session: mse.Session | null;

init();

function init() {
    player = mse.createPlayer(videoElement);
    wireUpButtons(() => {
        const s = player.startSession({
            url: 'http://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
            autoPlay: true,
            startingPosition: 0,
        });
        wireUpEvents(s);
        return s;
    });

    (window as any).v = videoElement;
}

function wireUpEvents(s: mse.Session) {
    s.onError.register(e => {
        appendLogLine(`ERROR >> source: ${e.source}, error: ${e.payload}`);
    });
    s.onPositionUpdate.register(e => {
        infoContainer.textContent = `Current time: ${e.currentTime}`;
    });

    appendLogLine(`STATE >> state: ${mse.SessionState[s.onStateChanged.getCurrentState()]}`);
    s.onStateChanged.register(e => {
        appendLogLine(`STATE >> state: ${mse.SessionState[e]}`);
    });

    function appendLogLine(text: string) {
        const p = document.createElement('p');
        const span = document.createElement('span');
        span.textContent = text;
        const br = document.createElement('br');
        p.appendChild(span);
        p.appendChild(br);
        logContainer.appendChild(p);
    }
}

function wireUpButtons(startSession: () => mse.Session) {
    const loadButton = document.getElementById('load') as HTMLButtonElement;
    loadButton.onclick = function() {
        if (!player || session) {
            return;
        }
        session = startSession();
        loadButton.disabled = true;
    };

    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    stopButton.onclick = function() {
        if (!session) {
            return;
        }
        session.stop().then(() => {
            loadButton.disabled = false;
            logContainer.textContent = '';
            infoContainer.textContent = '';
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
        session.resume();
    };
}
