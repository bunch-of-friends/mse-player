import { InternalError, StreamDescriptor, StreamTransport } from '@mse-player/core';
import { EventEmitter } from '../../common/event-emitter';
import { unwrap } from '../../helpers/unwrap';

export class ManifestAcquisitionManager {
    private readonly errorEmitter = new EventEmitter<InternalError>('manifestAcquisition');

    constructor(private streamTransport: StreamTransport) {}
    public async loadStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor> {
        const manifestAcquisition = await this.streamTransport.getStreamDescriptor(manifestUrl);
        if (!manifestAcquisition.isSuccess || !manifestAcquisition.streamDescriptor) {
            this.errorEmitter.notifyEvent(unwrap(manifestAcquisition.error));
            return Promise.reject();
        }

        return manifestAcquisition.streamDescriptor;
    }

    public getErrorEmitter(): EventEmitter<InternalError> {
        return this.errorEmitter;
    }
}
