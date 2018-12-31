import { StreamTransport, ManifestAquisition } from '@mse-player/core';
import { ManifestParser } from './manifest-parser';

export class DashStreamTransport extends StreamTransport {
    public getStreamDescriptor(): Promise<ManifestAquisition> {
        return this.httpHandler.getString(this.manifestUrl).then(response => {
            console.log(response); // tslint:disable-line no-console
            const manifestParser = new ManifestParser(this.httpHandler);
            return manifestParser.getStreamDescriptor(response);
        });
    }
}
