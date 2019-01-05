import { InternalError, StreamDescriptor, StreamTransport, unwrap } from '@mse-player/core';
import { EventEmitter } from '../../common/event-emitter';

export class ManifestAcquisitionManager {
    private readonly errorEmitter = new EventEmitter<InternalError>('manifestAcquisition');

    constructor(private streamTransport: StreamTransport) {}
    public async loadStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor> {
        const acqusition = await this.streamTransport.getStreamDescriptor(manifestUrl);
        if (!acqusition.isSuccess) {
            this.errorEmitter.notifyEvent(acqusition.error);
            return Promise.reject();
        } else {
            return acqusition.payload;
        }
    }

    public getErrorEmitter(): EventEmitter<InternalError> {
        return this.errorEmitter;
    }
}
