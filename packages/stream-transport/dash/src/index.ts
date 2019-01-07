import { StreamTransport, Acquisition, StreamDescriptor } from '@mse-player/core';
import { ManifestParser } from './manifest-parser';

export class DashStreamTransport extends StreamTransport {
    public async getStreamDescriptor(manifestUrl: string): Promise<Acquisition<StreamDescriptor>> {
        const response = await this.httpHandler.getXml(manifestUrl);
        const manifestParser = new ManifestParser(this.httpHandler);
        if (!response) {
            return Acquisition.error({
                payload: 'error requesting manifest',
            });
        } else {
            const streamDescriptor = manifestParser.getStreamDescriptor(response);
            return Acquisition.success(streamDescriptor);
        }
    }
}
