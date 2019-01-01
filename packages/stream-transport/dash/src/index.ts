import { StreamTransport, ManifestAcquisition } from '@mse-player/core';
import { ManifestParser } from './manifest-parser';

export class DashStreamTransport extends StreamTransport {
    public async getStreamDescriptor(): Promise<ManifestAcquisition> {
        const response = await this.httpHandler.getXml(this.manifestUrl);
        console.log(response); // tslint:disable-line no-console
        const manifestParser = new ManifestParser(this.httpHandler);
        if (!response) {
            return {
                isSuccess: false,
                error: {
                    payload: 'unknown error',
                },
            };
        }
        return manifestParser.getStreamDescriptor(response);
    }
}
