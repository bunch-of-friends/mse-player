export function createVideoElement(targetElement: HTMLElement, document: HTMLDocument) {
    const videoElement = document.createElement('video');
    targetElement.appendChild(videoElement);
    return videoElement;
}
