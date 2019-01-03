import { Analytics, HttpHandler as IHttpHandler } from '@mse-player/core';
export class HttpHandler extends IHttpHandler {
    public getXml(url: string): Promise<Document | null> {
        const onLoadHandler = (xhrResponse: XMLHttpRequest) => xhrResponse.responseXML;
        return this.sendXhr({
            url,
            responseType: 'document',
            mimeType: 'text/xml',
            onLoadHandler,
        });
    }

    public getArrayBuffer(url: string): Promise<ArrayBuffer> {
        const onLoadHandler = (xhrResponse: XMLHttpRequest) => xhrResponse.response;
        return this.sendXhr({
            url,
            responseType: 'arraybuffer',
            onLoadHandler,
        });
    }

    private sendXhr<T>(options: CreateXhrOptions<T>): Promise<T> {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.open(options.httpMethod || 'get', options.url);
            if (options.responseType) {
                xhr.responseType = options.responseType;
            }
            if (options.mimeType) {
                xhr.overrideMimeType(options.mimeType);
            }
            xhr.onload = function() {
                resolve(options.onLoadHandler(xhr));
            };
            xhr.send();
        });
    }
}

interface CreateXhrOptions<T> {
    url: string;
    httpMethod?: string;
    responseType?: XMLHttpRequestResponseType;
    mimeType?: string;
    onLoadHandler(xhr: XMLHttpRequest): T;
}
