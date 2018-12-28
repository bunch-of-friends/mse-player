import { createSession } from '../api/session';
import { Session, SessionOptions } from '../api/types';
import { SessionController } from './session-controller';
import { VideoElementWrapper } from './video-element-wrapper';
import { DependencyContainer } from '@mse-player/core';

export class PlayerController {
    private videoElementWrapper: VideoElementWrapper | null;
    private sessionController: SessionController | null;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElementWrapper = new VideoElementWrapper(videoElement);
    }

    public startSession(sessionOptions: SessionOptions): Session {
        if (this.sessionController) {
            throw 'session already exists';
        }

        this.sessionController = this.sessionControllerFactory(sessionOptions);
        return createSession(sessionOptions, this.sessionController);
    }

    public async dispose(): Promise<void> {
        if (this.sessionController) {
            await this.sessionController.dispose();
            this.sessionController = null;
        }

        if (this.videoElementWrapper) {
            this.videoElementWrapper.dispose();
            this.videoElementWrapper = null;
        }
    }

    private sessionControllerFactory = (sessionOptions: SessionOptions) => {
        if (!this.videoElementWrapper) {
            throw 'videoElementWrapper is null';
        }

        return new SessionController(
            this.videoElementWrapper,
            DependencyContainer.getStreamTransport(),
            sessionOptions
        );
    };
}
