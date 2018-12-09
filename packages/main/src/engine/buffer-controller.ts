import { SessionOptions } from '../api/session';

export class BufferController {
    // constructor() {
    //     const mediaSource = new MediaSource();
    //     videoElement.src = URL.createObjectURL(mediaSource);
    //     mediaSource.addEventListener('sourceopen', sourceOpen);
    //     videoElement.addEventListener('error', e => {
    //         console.log('player error', videoElement.error);
    //     });
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
