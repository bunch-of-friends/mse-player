import { Analytics } from './analytics';

export interface CreateXhrOptions<T> {
    url: string;
    httpMethod?: string;
    responseType?: XMLHttpRequestResponseType;
    mimeType?: string;
    onLoadHandler(xhr: XMLHttpRequest): T;
}

export abstract class HttpHandler {
    constructor(private analytics: Analytics) {}

    public abstract getXml(url: string): Promise<Document | null>;
    public abstract getArrayBuffer(url: string): Promise<ArrayBuffer>;
}
