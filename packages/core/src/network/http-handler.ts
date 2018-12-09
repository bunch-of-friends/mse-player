import { Logger } from '../logging/logger';

export class HttpHandler {
    constructor(private logger: Logger) {}

    public request(input: RequestInfo, init?: RequestInit | undefined): Promise<Response> {
        this.logger.log('test');
        return window.fetch(input, init);
    }
}
