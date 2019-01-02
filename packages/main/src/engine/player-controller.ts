import { createSession, SessionState } from '../api/session';
import { Session, SessionOptions } from '../api/session';
import { SessionController } from './session-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { DependencyContainer } from '../dependency/dependency-container';
import { createVideoElement } from '../helpers/dom-helper';

export class PlayerController {
    private sessionController: SessionController | null;
    constructor(private readonly videoElementContainer: HTMLElement) {
        if (!videoElementContainer) {
            throw 'videoElementContainer is not set';
        }
    }

    public startSession(sessionOptions: SessionOptions): Session {
        if (this.sessionController) {
            throw 'session already in progress';
        }

        this.sessionController = this.sessionControllerFactory();
        this.sessionController.load(sessionOptions);
        return createSession(this.sessionController);
    }

    private sessionControllerFactory = () => {
        const videoElement = createVideoElement(this.videoElementContainer);
        const videoElementWrapper = new VideoElementWrapper(videoElement);
        const sessionController = new SessionController(videoElementWrapper, DependencyContainer.getStreamTransport());
        sessionController.onStateChanged.register(state => {
            if (state === SessionState.Stopped) {
                this.sessionController = null;
            }
        });
        return sessionController;
    };
}
