import { createSubject } from '@bunch-of-friends/observable';
import { StreamTransport, Abr } from '@mse-player/core';
import { SessionState, SessionError, SessionOptions } from '../api/types';
import { BufferManager } from './buffer-manager';
import { VideoElementWrapper } from './video-element-wrapper';

export class SessionController {
    private bufferManager: BufferManager | null;
    private stateSubject = createSubject<SessionState>({ initialState: SessionState.Created });
    public onError = this.videoElementWrapper.onError;

    constructor(
        private videoElementWrapper: VideoElementWrapper,
        private streamTransport: StreamTransport,
        private abr: Abr,
        options: SessionOptions
    ) {
        this.stateSubject.notifyObservers(SessionState.ManifestLoading);

        this.streamTransport.getStreamDescriptor(options.url).then(streamDescriptor => {
            this.bufferManager = new BufferManager(this.videoElementWrapper, streamDescriptor);
            this.bufferManager.start(options.position);
        });
    }

    public pause(): void {
        if (!this.bufferManager) {
            return;
        }
        this.bufferManager.pause();
        this.videoElementWrapper.pause();
    }

    public resume(): void {
        if (!this.bufferManager) {
            return;
        }
        this.bufferManager.resume();
        this.videoElementWrapper.resume();
    }

    public dispose(): Promise<void> {
        this.videoElementWrapper.pause();
        if (this.bufferManager) {
            this.bufferManager.dispose();
        }
        return Promise.resolve();
    }
}
