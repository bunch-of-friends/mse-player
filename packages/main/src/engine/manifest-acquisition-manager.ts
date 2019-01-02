import { StreamDescriptor, StreamTransport, DependencyContainer } from '@mse-player/core';
import { SessionStateManager } from './session-state-manager';
import { ErrorEmitter } from './session-error-manager';

export class ManifestAcquisitionManager {
    private readonly errorEmitter = new ErrorEmitter('manifestAcquisition');

    constructor(private sessionStateManager: SessionStateManager, private streamTransport: StreamTransport) {}
    public async loadStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor> {
        const manifestAcquisition = await this.sessionStateManager.decorateLoadManifest(() => this.streamTransport.getStreamDescriptor(manifestUrl));
        if (!manifestAcquisition.isSuccess || !manifestAcquisition.streamDescriptor) {
            // TODO: implement error emitter
            return Promise.reject();
        }

        return manifestAcquisition.streamDescriptor;

        // const abr = DependencyContainer.getAbr(manifestAcquisition.streamDescriptor);

        // this.videoAdaptationSet = this.streamDescriptor.adaptationSets.filter(x => x.type === AdaptationSetType.Video)[0];
        // if (!this.videoAdaptationSet) {
        //     this.notifyError({ payload: 'no video adaptation sets found' });
        // }
    }

    public getErrorEmitter() {
        return this.errorEmitter;
    }
}
