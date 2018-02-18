export enum ModuleType {
    NetworkRequest,
    TransportStream
}

export interface Module {

}

const modulesMaps = new Map<ModuleType, Array<Module>>();

export function RegisterModule() {

}