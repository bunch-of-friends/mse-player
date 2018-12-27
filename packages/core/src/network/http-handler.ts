import { Logger } from '../logging/logger';

export class HttpHandler {
    constructor(private logger: Logger) {}

    public async getString(url: string): Promise<string> {
        return fetch(url).then(response => {
            return response.text();
        });
    }
}
