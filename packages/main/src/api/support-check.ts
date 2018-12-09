export function isSupported(): boolean {
    return typeof (window as any).MediaSource === 'function';
}
