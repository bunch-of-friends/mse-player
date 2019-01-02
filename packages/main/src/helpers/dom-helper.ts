export function createVideoElement(container: HTMLElement) {
    container.innerHTML = '';
    const videoElement = document.createElement('video');
    container.appendChild(videoElement);
    return videoElement;
}
