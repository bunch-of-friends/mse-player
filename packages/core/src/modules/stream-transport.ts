import { StreamDescriptor } from '../models/stream-descriptor';

export interface StreamTransport {
    getStreamDescriptor(manifestUrl: string): Promise<StreamDescriptor>;
}
