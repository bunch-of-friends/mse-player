import { HttpHandler, Logger, StreamTransport, Manifest } from '@mse-player/core';

export class SmoothStreamingTransport implements StreamTransport {
    constructor(private httpHandler: HttpHandler, private logger: Logger) {}

    public getManifest(manifestUrl: string): Promise<Manifest> {
        throw 'wip...';
    }
}
