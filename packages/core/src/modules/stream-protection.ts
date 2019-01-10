import { HttpHandlerBase } from "./http-handler";

export interface StreamProtectionCtr {
    new (httpHandler: HttpHandlerBase): StreamProtection;
}

export abstract class StreamProtection {
    public abstract readonly system: string;
    public abstract readonly uuid: string;

    constructor(protected readonly httpHandler: HttpHandlerBase) {}

    public abstract getLicense(licenseRequestMessage: ArrayBuffer): Promise<ArrayBuffer>;
}
