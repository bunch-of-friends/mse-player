export function unwrap<T>(nullable: T | null | undefined): T {
    if (!nullable) {
        throw 'error unwrapping nullable';
    }
    return nullable as T;
}
