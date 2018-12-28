import { HttpHandler, StreamTransport, StreamDescriptor } from '@mse-player/core';
import { parse } from 'mpd-parser';

export class DashStreamTransport extends StreamTransport {
    public getStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor> {
        return this.httpHandler.getString(manifestUrl).then(response => {
            const mpdManifest = parse(response, manifestUrl);
            return this.createStreamDescriptor(mpdManifest);
        });
    }

    private createStreamDescriptor(mpdManifest: any): StreamDescriptor {
        return {
            isLive: false,
            durationMs: mpdManifest.duration * 1000,
            adaptationSets: [],
        };
    }
}
