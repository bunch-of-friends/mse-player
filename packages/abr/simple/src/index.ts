import { Abr, HttpHandler, Logger } from '@mse-player/core';

export class SimpleAbr implements Abr {
    constructor(private httpHandler: HttpHandler, private logger: Logger) {}
}
