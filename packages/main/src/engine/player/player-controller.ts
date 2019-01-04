import { createSession, SessionState } from '../../api/session';
import { Session, SessionOptions } from '../../api/session';
import { SessionController } from '../session/session-controller';
import { VideoElementWrapper } from '../session/video-element-wrapper';
import { DependencyContainer } from '../../dependency/dependency-container';
import { createVideoElement } from '../../helpers/dom-helper';
import { HttpHandler } from '../../common/http-handler';

export class PlayerController {
    private sessionController: SessionController | null;
    private httpHandler = new HttpHandler();
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
        const sessionController = new SessionController(videoElementWrapper, DependencyContainer.getStreamTransport(this.httpHandler), this.httpHandler);
        sessionController.onStateChanged.register(state => {
            if (state === SessionState.Stopped) {
                this.sessionController = null;
            }
        });
        return sessionController;
    };
}
