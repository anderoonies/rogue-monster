export const KEY_DOWN = 'KEY_DOWN';
export function keyDown(keyCode) {
    return {
        type: KEY_DOWN,
        keyCode
    }
}

export const KEY_UP = 'KEY_DOWN';
export function keyUp(keyCode) {
    return {
        type: KEY_DOWN,
        keyCode
    }
}

export const RESIZE = 'RESIZE';
export function resize(dimensions) {
    return {
        type: RESIZE,
        dimensions
    }
}
