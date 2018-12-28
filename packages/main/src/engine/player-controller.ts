import { createSession } from '../api/session';
import { Session, SessionOptions } from '../api/types';
import { SessionController } from './session-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { DependencyContainer } from '@mse-player/core';

export class PlayerController {
    private videoElementWrapper: VideoElementWrapper | null;
    constructor(videoElement: HTMLVideoElement) {
        this.videoElementWrapper = new VideoElementWrapper(videoElement);
    }

    public startSession(sessionOptions: SessionOptions): Session {
        const sessionController = this.sessionControllerFactory(sessionOptions);
        return createSession(sessionController);
    }

    private sessionControllerFactory = (sessionOptions: SessionOptions) => {
        if (!this.videoElementWrapper) {
            throw 'videoElementWrapper is null';
        }

        return new SessionController(this.videoElementWrapper, DependencyContainer.getStreamTransport(sessionOptions.url), sessionOptions);
    };
}
