// INFO: this file is a complete throw-away, basicaly a placeholder for a real dependency management implementation
import { StreamTransport } from '../modules/stream-transport';
import { Abr } from '../modules/abr';
import { Logger } from '../logging/logger';
import { HttpHandler } from '../network/http-handler';

const logger = new Logger();
const httpHandler = new HttpHandler(logger);
let streamTransport: StreamTransport | null;
let abr: Abr | null;

export class DependencyContainer {
    public static getLogger() {
        return logger;
    }

    public static getHttpHandler() {
        return httpHandler;
    }

    public static setStreamTransport(newStreamTransport: StreamTransport) {
        streamTransport = newStreamTransport;
    }

    public static getStreamTransport(): StreamTransport {
        if (!streamTransport) {
            throw new Error('streamTransport not set');
        }
        return streamTransport;
    }

    public static setAbr(newAbr: Abr) {
        abr = newAbr;
    }

    public static getAbr(): Abr {
        if (!abr) {
            throw new Error('abr not set');
        }
        return abr;
    }
}
