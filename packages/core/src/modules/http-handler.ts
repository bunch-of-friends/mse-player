import { Analytics } from './analytics';

export class HttpHandler {
    constructor(private analytics: Analytics) {}
    public async getString(url: string): Promise<string> {
        return fetch(url).then(response => {
            return response.text();
        });
    }

    public async getArrayBuffer(url: string): Promise<ArrayBuffer> {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.open('get', url);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                resolve(xhr.response);
            };
            xhr.send();
        });
    }
}
