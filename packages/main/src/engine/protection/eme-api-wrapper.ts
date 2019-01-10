export class EmeApiWrapper {

    constructor(private readonly window: Window) {}

    public requestMediaKeySystemAccess(keySystem: string, supportedConfigurations: Array<MediaKeySystemConfiguration>) {
        return this.window.navigator.requestMediaKeySystemAccess(keySystem, supportedConfigurations);
    }
}
