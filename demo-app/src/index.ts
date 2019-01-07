import * as mse from '@mse-player/main';

const videoContainer = document.getElementById('video-container') as HTMLVideoElement;
const infoContainer = document.getElementById('info') as HTMLDivElement;
const logContainer = document.getElementById('log') as HTMLDivElement;
const manifestUrlSelect = document.getElementById('manifest-url-select') as HTMLSelectElement;
const manifestUrlInput = document.getElementById('manifest-url') as HTMLSelectElement;

let player: mse.Player | null;
let session: mse.Session | null;

init();

function init() {
    manifestUrlInput.value = localStorage.getItem('manifest-value') || manifestUrlInput.value;
    manifestUrlSelect.value = localStorage.getItem('manifest-value') || manifestUrlSelect.value;

    manifestUrlInput.addEventListener('change', saveCurrentManifestChoice);
    manifestUrlInput.addEventListener('keyup', saveCurrentManifestChoice)

    manifestUrlSelect.addEventListener('change', (e) => {
        const value = manifestUrlSelect.options[manifestUrlSelect.selectedIndex].value;
        manifestUrlInput.value = value;
        saveCurrentManifestChoice();
    });

    player = mse.createPlayer(videoContainer);

    wireUpButtons(() => {
        const s = player.startSession({
            url: manifestUrlSelect.value,
            autoPlay: true,
            startingPosition: 0,
        });
        wireUpEvents(s);
        return s;
    });
}

function saveCurrentManifestChoice() {
    const value = manifestUrlInput.value;
    manifestUrlSelect.value = value;
    localStorage.setItem('manifest-value', value);
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

    const seekInput = document.getElementById('seek-input') as HTMLInputElement;
    const seekButton = document.getElementById('seek') as HTMLButtonElement;
    seekButton.onclick = function() {
        if (!session) {
            return;
        }
        session.seek(parseInt(seekInput.value, 10));
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
