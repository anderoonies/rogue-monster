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

export const RELAX = 'RELAX';
export function relax() {
    return {
        type: RELAX
    }
}

export const TRIANGULATE = 'TRIANGULATE';
export function triangulate() {
    return {
        type: TRIANGULATE
    }
}

export const INIT = 'INIT';
export function init() {
    return {
        type: INIT
    }
}

export const MOVE_LEFT = 'MOVE_LEFT';
export function moveLeft() {
    return {
        type: MOVE_LEFT
    }
}
export const MOVE_RIGHT = 'MOVE_RIGHT';
export function moveRight() {
    return {
        type: MOVE_RIGHT
    }
}
export const MOVE_DOWN = 'MOVE_DOWN';
export function moveDown() {
    return {
        type: MOVE_DOWN
    }
}
export const MOVE_UP = 'MOVE_UP';
export function moveUp() {
    return {
        type: MOVE_UP
    }
}
