import { StreamDescriptor, StreamTransport } from '@mse-player/core';
import { DependencyContainer } from '../../dependency/dependency-container';
import { SessionStateManager } from '../session/session-state-manager';
import { ErrorEmitter } from '../session/session-error-manager';
import { unwrap } from '../../helpers/unwrap';

export class ManifestAcquisitionManager {
    private readonly errorEmitter = new ErrorEmitter('manifestAcquisition');

    constructor(private streamTransport: StreamTransport) {}
    public async loadStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor> {
        const manifestAcquisition = await this.streamTransport.getStreamDescriptor(manifestUrl);
        if (!manifestAcquisition.isSuccess || !manifestAcquisition.streamDescriptor) {
            this.errorEmitter.notifyError(unwrap(manifestAcquisition.error));
            return Promise.reject();
        }

        return manifestAcquisition.streamDescriptor;
    }

    public getErrorEmitter() {
        return this.errorEmitter;
    }
}
