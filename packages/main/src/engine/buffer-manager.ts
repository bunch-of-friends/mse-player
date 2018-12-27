import { StreamDescriptor, Logger } from '@mse-player/core';
import { VideoElementWrapper } from './video-element-wrapper';

export class BufferManager {
    constructor(private logger: Logger, private videoElementWrapper: VideoElementWrapper, private streamDescriptor: StreamDescriptor) {
        this.logger.log('streamDescriptor >> ', this.streamDescriptor);
    }

    public start(positionMs: number): void {
        // wip
    }

    public pause(): void {
        // wip
    }

    public resume(): void {
        // wip
    }

    public dispose(): void {
        // wip
    }

    // constructor() {
    //     const mediaSource = new MediaSource();
    //     videoElement.src = URL.createObjectURL(mediaSource);
    //     mediaSource.addEventListener('sourceopen', sourceOpen);

    //     function sourceOpen(e: any) {
    //         URL.revokeObjectURL(videoElement.src);
    //         const mime = 'video/webm; codecs="opus, vp09.00.10.08"';
    //         const sourceBuffer = mediaSource.addSourceBuffer(mime);
    //         fetch(sessionOptions.url, {
    //             mode: 'no-cors'
    //           })
    //             .then(function (response) {
    //                 return response.arrayBuffer();
    //             })
    //             .then(function (arrayBuffer) {
    //                 sourceBuffer.addEventListener('updateend', () => {
    //                     if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
    //                         mediaSource.endOfStream();
    //                     }
    //                 });
    //                 sourceBuffer.appendBuffer(arrayBuffer);
    //             });
    //     }
    //  }
}
