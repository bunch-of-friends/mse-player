export class HttpHandler {
    constructor() {}

    public async getString(url: string): Promise<string> {
        return fetch(url).then(response => {
            return response.text();
        });
    }
}
