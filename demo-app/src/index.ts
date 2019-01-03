import * as mse from '@mse-player/main';

const videoContainer = document.getElementById('video-container') as HTMLVideoElement;
const infoContainer = document.getElementById('info') as HTMLDivElement;
const logContainer = document.getElementById('log') as HTMLDivElement;

let player: mse.Player | null;
let session: mse.Session | null;

init();

function init() {
    player = mse.createPlayer(videoContainer);

    wireUpButtons(() => {
        const s = player.startSession({
            url: (document.getElementById('manifest-url') as HTMLInputElement).value,
            autoPlay: true,
            startingPosition: 0,
        });
        wireUpEvents(s);
        return s;
    });
}

function wireUpEvents(s: mse.Session) {
    s.onError.register(e => {
        appendLogLine(`ERROR >> source: ${e.source}, error: ${JSON.stringify(e.payload)}`);
    });
    s.onPositionUpdate.register(e => {
        infoContainer.textContent = `Current time: ${e.currentTime}`;
    });

    appendLogLine(`STATE >> state: ${mse.SessionState[s.onStateChanged.getCurrentState()]}`);
    s.onStateChanged.register(e => {
        appendLogLine(`STATE >> state: ${mse.SessionState[e]}`);
        if (e === mse.SessionState.Stopped) {
            session = null;
        }
    });
}

function wireUpButtons(startSession: () => mse.Session) {
    const loadButton = document.getElementById('load') as HTMLButtonElement;
    loadButton.onclick = function() {
        if (!player || session) {
            return;
        }
        logContainer.textContent = '';
        infoContainer.textContent = '';
        session = startSession();
    };

    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    stopButton.onclick = function() {
        if (!session) {
            return;
        }
        session.stop().then(() => {
            appendLogLine('stop() promise resolved');
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

function appendLogLine(text: string) {
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.textContent = text;
    const br = document.createElement('br');
    p.appendChild(span);
    p.appendChild(br);
    logContainer.appendChild(p);
}
