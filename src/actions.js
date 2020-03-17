export const KEY_DOWN = "KEY_DOWN";
export function keyDown(keyCode) {
    return {
        type: KEY_DOWN,
        keyCode
    };
}

export const KEY_UP = "KEY_DOWN";
export function keyUp(keyCode) {
    return {
        type: KEY_DOWN,
        keyCode
    };
}

export const RESIZE = "RESIZE";
export function resize(dimensions) {
    return {
        type: RESIZE,
        dimensions
    };
}

export const DEBUG_RELAX = "DEBUG_RELAX";
export function debugRelax() {
    return {
        type: DEBUG_RELAX
    };
}

export const DEBUG_HALLWAYS = "DEBUG_HALLWAYS";
export function debugHallways() {
    return {
        type: DEBUG_HALLWAYS
    };
}

export const DEBUG_INIT = "DEBUG_INIT";
export function debugInit() {
    return {
        type: DEBUG_INIT
    };
}

export const DEBUG_EDGES = "DEBUG_EDGES";
export function debugEdges() {
    return {
        type: DEBUG_EDGES
    };
}

export const DEBUG_TRIANGULATE = "DEBUG_TRIANGULATE";
export function debugTriangulate() {
    return {
        type: DEBUG_TRIANGULATE
    };
}

export const INIT = "INIT";
export function init() {
    return {
        type: INIT
    };
}

export const MOVE = "MOVE";
export function move(transform) {
    return {
        type: MOVE,
        transform
    };
}

export const ACCRETION_INIT = "ACCRETION_INIT";
export function accretionInit() {
    return {
        type: ACCRETION_INIT
    };
}

export const DEBUG_ADD_ROOM = "DEBUG_ADD_ROOM";
export function debugAddRoom() {
    return {
        type: DEBUG_ADD_ROOM
    };
}

export const DEBUG_SHOW_CA = "DEBUG_SHOW_CA";
export function debugShowCA() {
    return {
        type: DEBUG_SHOW_CA
    };
}

export const DEBUG_CA_GENERATION = "DEBUG_CA_GENERATION";
export function debugCAGeneration() {
    return {
        type: DEBUG_CA_GENERATION
    };
}

export const DEBUG_CA_PAINT = "DEBUG_CA_PAINT";
export function debugCAPaint() {
    return {
        type: DEBUG_CA_PAINT
    };
}

export const DEBUG_FIND_ROOM_PLACEMENT = "DEBUG_FIND_ROOM_PLACEMENT";
export function debugFindRoomPlacement() {
    return {
        type: DEBUG_FIND_ROOM_PLACEMENT
    };
}

export const CLICK = "CLICK";
export function click({x, y, which}) {
    return {
        type: CLICK,
        x,
        y,
        which
    };
}
