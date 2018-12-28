import { createSubject } from '@bunch-of-friends/observable';
import { StreamTransport, Abr, DependencyContainer } from '@mse-player/core';
import { SessionState, SessionError, SessionOptions } from '../api/types';
import { BufferController } from './buffer-controller';
import { VideoElementWrapper } from './video-element-wrapper';

export class SessionController {
    private bufferManager: BufferController | null;
    private stateSubject = createSubject<SessionState>({ initialState: SessionState.Created });
    public onError = this.videoElementWrapper.onError;

    constructor(private videoElementWrapper: VideoElementWrapper, private streamTransport: StreamTransport, options: SessionOptions) {
        this.stateSubject.notifyObservers(SessionState.ManifestLoading);

        this.streamTransport.getStreamDescriptor().then(streamDescriptor => {
            const abr = DependencyContainer.getAbr(streamDescriptor);
            this.bufferManager = new BufferController(this.videoElementWrapper, streamDescriptor, abr);
            this.bufferManager.setStartingPosition(options.position);
            if (options.autoPlay) {
                this.play();
            }
        });
    }

    public pause(): void {
        if (!this.bufferManager) {
            return;
        }
        this.bufferManager.pause();
        this.videoElementWrapper.pause();
    }

    public play(): void {
        if (!this.bufferManager) {
            return;
        }
        this.bufferManager.play();
        this.videoElementWrapper.play();
    }

    public dispose(): Promise<void> {
        this.videoElementWrapper.pause();
        if (this.bufferManager) {
            this.bufferManager.dispose();
        }
        return Promise.resolve();
    }
}
