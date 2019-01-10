import { DependencyContainer } from '../dependency/dependency-container';
import { DashStreamTransport } from '@mse-player/dash';
import { PlayReadyProtection } from '@mse-player/playready';
import { SingleLevelAbr } from '@mse-player/single-level-abr';

// INFO: main only depends on dash and single-level-abr temporarily for ealy stages of development
// the intention is that those should be resolved in run-time based on the user's choice or the stream-type
export function init() {
    DependencyContainer.initialise(DashStreamTransport, PlayReadyProtection, SingleLevelAbr);
}
