export interface HttpHandlerBase {
    getXml(url: string): Promise<Document | null>;
    getArrayBuffer(url: string): Promise<ArrayBuffer>;
}

export interface HttpHandlerResponseMetadata {
    responseSizeInBytes: number;
    timeOfRequest: number;
    timeOfResponse: number;
    timeTaken: number;
}
