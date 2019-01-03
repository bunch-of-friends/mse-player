export interface HttpHandlerBase {
    getXml(url: string): Promise<Document | null>;
    getArrayBuffer(url: string): Promise<ArrayBuffer>;
}
