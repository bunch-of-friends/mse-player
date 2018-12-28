// INFO: this file is a complete throw-away, basicaly a placeholder for a real dependency management implementation
import { StreamTransport, StreamTransportCtr, StreamDescriptor } from '../modules/stream-transport';
import { Abr, AbrCtr } from '../modules/abr';
import { HttpHandler } from '../modules/http-handler';
import { Analytics } from '../modules/analytics';

const analytics = new Analytics();
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

    public static getStreamTransport(manifestUrl: string): StreamTransport {
        if (!streamTransportCtr) {
            throw new Error('streamTransportCtr not set');
        }
        return new streamTransportCtr(manifestUrl, this.getHttpHandler());
    }

    public static getAbr(streamDescriptor: StreamDescriptor): Abr {
        if (!abrCtr) {
            throw new Error('abrCtr not set');
        }
        return new abrCtr(streamDescriptor);
    }
}
