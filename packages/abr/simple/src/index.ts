import { Abr, HttpHandler } from '@mse-player/core';

export class SimpleAbr implements Abr {
    constructor(private httpHandler: HttpHandler) {}
}
