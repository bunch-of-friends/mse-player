import { InternalError } from './internal-error';
import { unwrap } from '../helpers/unwrap';

export class Acquisition<T> {
    public static success<T>(payload: T): Acquisition<T> {
        return new Acquisition(payload, null);
    }

    public static error<T>(error: InternalError): Acquisition<T> {
        return new Acquisition<T>(null, error);
    }

    private payloadInternal: T | null;
    private errorInternal: InternalError | null;
    public readonly isSuccess: boolean;

    private constructor(payload: T | null, error: InternalError | null) {
        if (!payload) {
            if (!error) {
                throw 'invalid operation: acqquistion has to be instantiated with either error or payload objects';
            }

            this.isSuccess = false;
            this.errorInternal = error;
        } else {
            this.isSuccess = true;
            this.payloadInternal = payload;
        }
    }

    public get payload(): T {
        if (!this.isSuccess) {
            throw 'acquisition failed, cannot provide payload';
        }

        return unwrap(this.payloadInternal);
    }

    public get error(): InternalError {
        if (this.isSuccess) {
            throw 'acquisition succeded, cannot provide error';
        }
        return unwrap(this.errorInternal);
    }
}
