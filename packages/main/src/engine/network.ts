export function get(url: string) {
    return fetch(url, {
        mode: 'no-cors',
    }).then(response => {
        return response.arrayBuffer();
    });
}
