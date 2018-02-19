import { Session, SessionOptions } from './session';

export class Player {

    private currentSession: Session = null;

    constructor(private targetElement: HTMLVideoElement) {

    }

    public startSession(sessionOptions: SessionOptions): Session {
        // this.currentSession = new Session(sessionOptions);
        // this.currentSession.onStopped.registerObserver(() => {
        //     this.currentSession.onStopped.unregisterObserversOfOwner(this);
        //     this.currentSession = null;
        // }, this);
        // return this.currentSession;
        return null;
    }

    public destroy() {
        if (this.currentSession) {
            throw new Error('session in progress');
        }

        // TODO...
    }
}
