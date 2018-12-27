import { DependencyContainer } from '@mse-player/core';
import { DashStreamTransport } from '@mse-player/dash';
import { SimpleAbr } from '@mse-player/simple-abr';

// INFO: main only depends on dash and simple-abr temporarily for ealy stages of development
// the intention is that those should be resolved in run-time based on the user's chcoice or the stream-type
export function init() {
    DependencyContainer.setStreamTransport(new DashStreamTransport(DependencyContainer.getHttpHandler(), DependencyContainer.getLogger()));
    DependencyContainer.setAbr(new SimpleAbr(DependencyContainer.getHttpHandler(), DependencyContainer.getLogger()));
}
