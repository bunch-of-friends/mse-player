import { VideoElementWrapper } from '../session/video-element-wrapper';
import { DataViewHelper } from './data-view-helper';
import { StreamProtection } from '@mse-player/core';
import { EmeApiWrapper } from './eme-api-wrapper';

// TODO: currently none of the event listeners are cleaned up when the session finishes
export class StreamProtectionController {
    private mediaKeysSession: MediaKeySession | null = null;

    constructor(private readonly videoElementWrapper: VideoElementWrapper, private readonly emeApiWrapper: EmeApiWrapper, private readonly streamProtection: StreamProtection) {
        this.videoElementWrapper.onEncryptedEvent.register(this.handleVideoElementEncryptionEvent);
    }

    private handleVideoElementEncryptionEvent = (event: MediaEncryptedEvent) => {
        const { initDataType, initData: initDataRaw } = event;
        const initData = ArrayBuffer.isView(initDataRaw) ? initDataRaw.buffer : initDataRaw;

        if (!initData) {
            console.error('NO INIT DATA ON ENCRYPTION EVENT', event);
            return;
        }

        const psshData = this.parsePsshData(initData);

        // TODO: currently we only inject 1 system-protection at a time. We should support the ability to specify multiple and then we need to pick one that works
        if (!psshData[this.streamProtection.uuid]) {
            console.error(`KEY SYSTEM NOT SUPPORTED. Expected ${this.streamProtection.uuid} but got [${Object.keys(psshData).join(', ')}]`);
            return;
        }

        const systemConfigurations = this.getSystemConfigurations(initDataType)

        this.emeApiWrapper.requestMediaKeySystemAccess(this.streamProtection.system, systemConfigurations).then((mediaKeySystemAccess) => {
            return mediaKeySystemAccess.createMediaKeys();
        }).then((mediaKeys) => {
            return this.videoElementWrapper.setMediaKeys(mediaKeys).then(() => {
                // TODO: The creating session and session event handling methods could probably be in their own class.
                this.mediaKeysSession = mediaKeys.createSession();
                
                this.mediaKeysSession.addEventListener('keystatuseschange', this.handleSessionKeyStatusesChangeEvent);
                this.mediaKeysSession.addEventListener('message', this.handleSessionMessageEvent);

                return this.mediaKeysSession.generateRequest(initDataType, initData);
            });
        });
    }

    // TODO: This needs to go via system specific interface (e.g. PlayReadyProtection) and also take input from manifest for codecs
    private getSystemConfigurations(initDataType: string): Array<MediaKeySystemConfiguration> {
        return [{
            initDataTypes: [initDataType],
            audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
            videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.640028"' }],
            distinctiveIdentifier: 'optional',
            persistentState: 'required'
        }];
    }

    private parsePsshData(data: ArrayBuffer) {
        const dataView = new DataView(data);
        const dataViewHelper = new DataViewHelper(dataView);
        const pssh = {} as { [key: string]: ArrayBuffer };

        let currentBoxOffset = 0;
        let nextBoxOffset = 0;

        while (dataViewHelper.setOffset(nextBoxOffset), !dataViewHelper.isAtEndOfBuffer()) {
            currentBoxOffset = nextBoxOffset;

            // work out where next box starts
            const currentBoxSize = dataViewHelper.consumeUint32();
            nextBoxOffset = currentBoxOffset + currentBoxSize;

            // verify current box is PSSH
            if (dataViewHelper.consumeUint32() !== 0x70737368) {
                continue;
            }

            // make sure it is a valid version
            const version = dataViewHelper.consumeUint8();
            if (version !== 0 && version !== 1) {
                continue;
            }

            // unused flags
            dataViewHelper.skipBytes(3);

            // extract UUID
            const systemId = `${dataViewHelper.consumeString(4)}-${dataViewHelper.consumeString(2)}-${dataViewHelper.consumeString(2)}-${dataViewHelper.consumeString(2)}-${dataViewHelper.consumeString(6)}`.toLowerCase();
            const psshData = dataView.buffer.slice(currentBoxOffset, nextBoxOffset);
            
            pssh[systemId] = psshData;
        }

        return pssh;
    }

    private handleSessionMessageEvent = (event: Event) => {
        const messageEvent = event as MediaKeyMessageEvent;

        switch(messageEvent.messageType) { 
            case 'license-request':
                this.streamProtection.getLicense(messageEvent.message).then((response) => {
                    if (!this.mediaKeysSession) {
                        throw 'Recieved license but no media-keys-session exists to update';
                    }
                    this.mediaKeysSession.update(response);
                }).catch((e) => {
                    console.error('Error getting license', e);
                });
                break;
            default:
                console.error('unhandled session message type', messageEvent);
                break;
        }
    }

    private handleSessionKeyStatusesChangeEvent = (event: Event) => {
        console.log('Key statuses have changed', event);
    }
}
