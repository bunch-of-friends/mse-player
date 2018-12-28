import { Analytics } from './analytics';

export class HttpHandler {
    constructor(private analytics: Analytics) {}
    public async getString(url: string): Promise<string> {
        return fetch(url).then(response => {
            return response.text();
        });
    }
}
