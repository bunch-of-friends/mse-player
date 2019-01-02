import { Analytics } from './analytics';

export abstract class HttpHandler {
    constructor(private analytics: Analytics) {}

    public abstract getXml(url: string): Promise<Document | null>;
    public abstract getArrayBuffer(url: string): Promise<ArrayBuffer>;
}
