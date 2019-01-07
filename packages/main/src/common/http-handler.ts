import { HttpHandlerResponseMetadata } from '@mse-player/core';
import { EventEmitter } from './event-emitter';
export class HttpHandler {
    private analyticsEmitter = new EventEmitter<HttpHandlerResponseMetadata>('httpHandler');

    public getXml(url: string): Promise<Document | null> {
        const onLoadHandler = (xhrResponse: XMLHttpRequest) => {
            // this.analyticsEmitter.notifyEvent({ responseSizeInBytes: xhrResponse.response.byteLength });
            return xhrResponse.responseXML;
        };
        return this.sendXhr({
            requestTime: Date.now(),
            url,
            responseType: 'document',
            mimeType: 'text/xml',
            onLoadHandler,
        });
    }

    public getArrayBuffer(url: string): Promise<ArrayBuffer> {
        const onLoadHandler = (xhrResponse: XMLHttpRequest, metadata: ResponseMetadata) => {
            this.analyticsEmitter.notifyEvent({ responseSizeInBytes: xhrResponse.response.byteLength, ...metadata });
            return xhrResponse.response;
        };
        return this.sendXhr({
            requestTime: Date.now(),
            url,
            responseType: 'arraybuffer',
            onLoadHandler,
        });
    }

    public getAnalyticsEmitter() {
        return this.analyticsEmitter;
    }

    private sendXhr<T>(options: CreateXhrOptions<T>): Promise<T> {
        // console.log('EXECUTING HTTP REQUEST ---->', options);
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
                const responseTime = Date.now();
                const timeTaken = responseTime - options.requestTime;
                const responseMetadata: ResponseMetadata = {
                    timeOfRequest: options.requestTime,
                    timeOfResponse: responseTime,
                    timeTaken,
                };
                // console.log('RESPONSE ---->', xhr.response);
                resolve(options.onLoadHandler(xhr, responseMetadata));
            };
            xhr.send(null);
        });
    }
}

interface CreateXhrOptions<T> {
    url: string;
    httpMethod?: string;
    requestTime: number;
    responseType?: XMLHttpRequestResponseType;
    mimeType?: string;
    onLoadHandler(xhr: XMLHttpRequest, metadata: ResponseMetadata): T;
}

interface ResponseMetadata {
    timeOfRequest: number;
    timeOfResponse: number;
    timeTaken: number;
}
