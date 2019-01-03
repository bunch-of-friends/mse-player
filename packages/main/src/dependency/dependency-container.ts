// INFO: this file is a complete throw-away, basicaly a placeholder for a real dependency management implementation
import { Abr, AbrCtr, StreamTransport, StreamTransportCtr, StreamDescriptor } from '@mse-player/core';
import { HttpHandler } from '../common/http-handler';
import { Analytics } from '../engine/session/analytics';

const analytics = new Analytics({} as HTMLVideoElement);
const httpHandler = new HttpHandler(analytics);
let streamTransportCtr: StreamTransportCtr | null;
let abrCtr: AbrCtr | null;

export class DependencyContainer {
    public static initialise(newStreamTransportCtr: StreamTransportCtr, newAbrCtr: AbrCtr) {
        streamTransportCtr = newStreamTransportCtr;
        abrCtr = newAbrCtr;
    }

    public static getHttpHandler() {
        return httpHandler;
    }

    public static getStreamTransport(): StreamTransport {
        if (!streamTransportCtr) {
            throw new Error('streamTransportCtr not set');
        }
        return new streamTransportCtr(this.getHttpHandler());
    }

    public static getAbr(streamDescriptor: StreamDescriptor): Abr {
        if (!abrCtr) {
            throw new Error('abrCtr not set');
        }
        return new abrCtr(streamDescriptor);
    }
}
