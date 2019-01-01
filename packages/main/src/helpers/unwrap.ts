export function unwrap<T>(nullable: T | null): T {
    if (!nullable) {
        throw 'error unwrapping nullable';
    }
    return nullable as T;
}
