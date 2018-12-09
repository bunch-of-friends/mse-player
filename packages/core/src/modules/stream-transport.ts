import { Manifest } from '../models/manifest';

export interface StreamTransport {
    getManifest(manifestUrl: string): Promise<Manifest>;
}
