import { StreamProtection } from '@mse-player/core';

export class PlayReadyProtection extends StreamProtection {
    public readonly system = 'com.microsoft.playready';
    public readonly uuid = '9a04f079-9840-4286-ab92-e65be0885f95';

    public getLicense(licenseRequestMessage: ArrayBuffer): Promise<ArrayBuffer> {
        const xmlString = String.fromCharCode.apply(null, new Uint16Array(licenseRequestMessage));
        const xmlDoc = new DOMParser().parseFromString(xmlString, 'text/xml');
    
        // TODO: error handling
        const challengeBase64 = xmlDoc.getElementsByTagName('Challenge')[0].childNodes[0].nodeValue || '';
        const challengeString = atob(challengeBase64);

        // TODO: replace with this.httpHandler
        // TODO: Get license acquisition URL with the value from the initial 'startSession' config
        return fetch('https://test.playready.microsoft.com/service/rightsmanager.asmx?PlayRight=1&UseSimpleNonPersistentLicense=1', { method: 'POST', body: challengeString, headers: { 'Content-Type': 'text/xml; charset=utf-8' } }).then((response) => {
            return response.arrayBuffer();
        });
    }
}
