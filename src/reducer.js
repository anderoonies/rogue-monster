import {
    MOVE_LEFT,
    MOVE_RIGHT,
    MOVE_UP,
    MOVE_DOWN,
    RESIZE,
    DEBUG_RELAX,
    DEBUG_TRIANGULATE,
    INIT,
    DEBUG_INIT,
    DEBUG_HALLWAYS
} from "./actions";
import Cell, { floorCell } from "./Cell";
import {
    generateRooms,
    finalizeRooms,
    relaxRooms,
    triangulate,
    boundX,
    boundY,
    makeHallways,
    hallways,
    bfsPlusExtra
} from "./levels/levelCreator.js";
import { debugRelax, debugHallways, debugTriangulate } from "./actions";
import { scan } from "./light";
import { FOV, WIDTH, HEIGHT } from "./constants";

const roomsToDungeon = (rooms, hallwayRooms, width, height) => {
    let dungeon = new Array(height).fill(undefined).map(row => {
        return new Array(width).fill({ type: "rock", letter: "#" });
    });
    const bound = (room, width, height) => {
        return {
            ...room,
            top: Math.max(0, room.top),
            bottom: Math.min(height, room.bottom),
            left: Math.max(0, room.left),
            right: Math.min(width, room.right),
            center: {
                x: Math.min(width, Math.max(0, room.center.x)),
                y: Math.min(height, Math.max(0, room.center.y))
            }
        };
    };
    rooms.forEach((room, i) => {
        room = bound(room, width, height);
        for (let row = room.top; row < room.bottom; row++) {
            for (let col = room.left; col < room.right; col++) {
                try {
                    dungeon[row][col] = {
                        type: "floor",
                        letter: ",",
                        debugLetter: i
                    };
                } catch (e) {
                    debugger;
                }
            }
        }
    });
    hallwayRooms.forEach((hallwayRoom, i) => {
        if (!hallwayRoom) {
            return;
        }
        switch (hallwayRoom.orientation) {
            case "vertical": {
                let { x, bottom, top } = hallwayRoom;
                for (let row = bottom; row >= top; row--) {
                    if (row < bottom && row > top) {
                        dungeon[row][x - 1] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'v',
                        };
                        dungeon[row][x + 1] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'v',
                        };
                    }
                    dungeon[row][x] = {
                        type: "floor",
                        letter: ",",
                        debugLetter: 'v',
                    };
                }
                break;
            }
            case "horizontal": {
                let { y, left, right } = hallwayRoom;
                for (let col = left; col <= right; col++) {
                    if (col > left && col < right) {
                        dungeon[y - 1][col] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'h',
                        };

                        dungeon[y + 1][col] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'h',
                        };
                    }
                    dungeon[y][col] = {
                        type: "floor",
                        letter: ",",
                        debugLetter: 'h',
                    };
                }
                break;
            }
            case "elbow": {
                let { major, lx, ly, ry, rx } = hallwayRoom;
                if (major === "right") {
                    for (let col = lx; col < rx; col++) {
                        if (col > lx + 1) {
                            dungeon[ly - 1][col] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'r'
                            };

                            dungeon[ly + 1][col] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'r'
                            };
                        }
                        dungeon[ly][col] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'r'
                        };
                    }
                    const ascending = ry < ly;
                    if (ascending) {
                        for (let row = ly; row > ry; row--) {
                            if (row > ry) {
                                dungeon[row][rx - 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ra'
                                };
                                dungeon[row][rx + 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ra'
                                };
                            }
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'ra'
                            };
                        }
                    } else {
                        for (let row = ly; row < ry; row++) {
                            if (row < ry - 1) {
                                dungeon[row][rx - 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'rd'
                                };
                                dungeon[row][rx + 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'rd'
                                };
                            }
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'rd'
                            };
                        }
                    }
                } else {
                    for (let col = rx; col > lx; col--) {
                        if (col < rx - 1) {
                            dungeon[ry - 1][col] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'u'
                            };
                            dungeon[ry + 1][col] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'u'
                            };
                        }
                        dungeon[ry][col] = {
                            type: "floor",
                            letter: ",",
                            debugLetter: 'u'
                        };
                    }
                    const ascending = ly < ry;
                    if (ascending) {
                        for (let row = ry; row >= ly; row--) {
                            if (row > ly) {
                                dungeon[row][lx - 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ua'
                                };
                                dungeon[row][lx + 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ua'
                                };
                            }
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'ua'
                            };
                        }
                    } else {
                        for (let row = ry; row <= ly; row++) {
                            if (row < ly) {
                                dungeon[row][lx - 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ud'
                                };
                                dungeon[row][lx + 1] = {
                                    type: "floor",
                                    letter: ",",
                                    debugLetter: 'ud'
                                };
                            }
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ",",
                                debugLetter: 'ud'
                            };
                        }
                    }
                }
                break;
            }
            default:
                break;
        }
    });
    return dungeon;
};

const clipFOV = (player, dungeon) => {
    let adjustedPlayer = {
        x: player.x,
        y: player.y
    };
    let fovTop;
    let fovRight;
    let fovBottom;
    let fovLeft;
    if (player.x > dungeon[0].length - FOV / 2) {
        // player stuck on the right
        adjustedPlayer.x = FOV - (dungeon[0].length - player.x);
        fovRight = dungeon[0].length;
        fovLeft = fovRight - FOV;
    } else if (player.x < FOV / 2) {
        // player stuck on the left
        adjustedPlayer.x = player.x;
        fovRight = dungeon[0].length;
        fovLeft = fovRight - FOV;
    } else {
        adjustedPlayer.x = Math.floor(FOV / 2);
        fovRight = player.x + FOV / 2;
        fovLeft = player.x - FOV / 2;
    }
    if (player.y < FOV / 2) {
        // player stuck on the top
        adjustedPlayer.y = boundY(player.y);
        fovTop = 0;
        fovBottom = FOV;
    } else if (player.y > dungeon.length - FOV / 2) {
        // player stuck on the bottom
        adjustedPlayer.y = FOV - (dungeon.length - player.y);
        fovTop = dungeon.length - FOV;
        fovBottom = dungeon.length;
    } else {
        adjustedPlayer.y = Math.floor(FOV / 2);
        fovTop = player.y - FOV / 2;
        fovBottom = player.y + FOV / 2;
    }

    const leftOffset = fovLeft;
    const topOffset = fovTop;

    const clippedFOV = dungeon.slice(fovTop, fovBottom).map(row => {
        return row.slice(fovLeft, fovRight);
    });
    clippedFOV[adjustedPlayer.y][adjustedPlayer.x] = { type: "player" };
    return {
        clippedFOV,
        centeredPlayer: adjustedPlayer,
        leftOffset,
        topOffset
    };
};

const light = (player, dungeon, globalMemory, leftOffset, topOffset) => {
    const { lightMap, memory } = scan(player, dungeon);
    const localMemory = memory;
    // TODO update global memory from local memory
    for (let row = 0; row < localMemory.length; row++) {
        for (let col = 0; col < localMemory[0].length; col++) {
            globalMemory[row + topOffset][col + leftOffset] =
                localMemory[row][col];
        }
    }
    // apply memory to the global dungeon
    return { lightMap, updatedMemory: globalMemory };
};

const flatten = (clippedFOV, memory, light) => {
    let annotatedFOV = [...clippedFOV];
    for (let row = 0; row < clippedFOV.length; row++) {
        for (let col = 0; col < clippedFOV[0].length; col++) {
            annotatedFOV[row][col] = {
                ...clippedFOV[row][col],
                light: light[row][col],
                memory: memory[row][col],
                row,
                col
            };
        }
    }
    return annotatedFOV;
};

const initialRooms = generateRooms({
    radius: 50,
    nRooms: 150
});
const player = {
    x: boundX(initialRooms[0].center.x),
    y: boundY(initialRooms[0].center.y)
};
const initialDungeon = roomsToDungeon(initialRooms, [], WIDTH, HEIGHT);
const initialMemory = new Array(initialDungeon.length)
    .fill(undefined)
    .map(row => {
        return new Array(initialDungeon[0].length).fill(undefined);
    });
const { clippedFOV, centeredPlayer, leftOffset, topOffset } = clipFOV(
    player,
    initialDungeon
);
const { lightMap, updatedMemory } = light(
    centeredPlayer,
    clippedFOV,
    initialMemory,
    leftOffset,
    topOffset
);
const fov = flatten(clippedFOV, updatedMemory, lightMap);

const initialState = {
    rooms: initialRooms,
    dungeon: initialDungeon,
    viewHeight: HEIGHT,
    viewWidth: WIDTH,
    settled: false,
    finalized: false,
    player,
    fov,
    memory: updatedMemory
};
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case INIT:
            const [initialRooms, hallwayRooms] = finalizeRooms({
                radius: 50,
                nRooms: 150
            });
            const player = {
                x: boundX(initialRooms[0].center.x),
                y: boundY(initialRooms[0].center.y)
            };
            const initialDungeon = roomsToDungeon(
                initialRooms,
                hallwayRooms,
                WIDTH,
                HEIGHT
            );
            const initialMemory = new Array(initialDungeon.length)
                .fill(undefined)
                .map(row => {
                    return new Array(initialDungeon[0].length).fill(undefined);
                });
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(player, initialDungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                initialMemory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    dungeon: initialDungeon,
                    rooms: initialRooms,
                    hallwayRooms,
                    settled: true,
                    fov,
                    player,
                    memory: updatedMemory
                },
                () => {}
            ];
        case DEBUG_INIT: {
            // don't finalize rooms
            const initialRooms = generateRooms({
                radius: 20,
                nRooms: 75
            });
            const player = {
                x: boundX(initialRooms[0].center.x),
                y: boundY(initialRooms[0].center.y)
            };
            const initialDungeon = roomsToDungeon(
                initialRooms,
                [],
                WIDTH,
                HEIGHT
            );
            const initialMemory = new Array(initialDungeon.length)
                .fill(undefined)
                .map(row => {
                    return new Array(initialDungeon[0].length).fill(undefined);
                });
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(player, initialDungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                initialMemory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    debugMsg: "Generated rooms",
                    dungeon: initialDungeon,
                    rooms: initialRooms,
                    settled: false,
                    fov,
                    player,
                    memory: updatedMemory
                },
                () => {
                    return new Promise((resolve, reject) => {
                        window.addEventListener(
                            "keydown",
                            () => {
                                resolve(debugRelax());
                            },
                            { once: true }
                        );
                    });
                }
            ];
        }
        case DEBUG_RELAX: {
            const [relaxedRooms, updated] = relaxRooms(state.rooms);
            const dungeon = roomsToDungeon(relaxedRooms, [], WIDTH, HEIGHT);
            return [
                {
                    ...state,
                    debugMsg: "Relaxing rooms...",
                    rooms: relaxedRooms,
                    dungeon,
                    settled: !updated
                },
                state.settled
                    ? () => {
                          return debugTriangulate();
                      }
                    : () => {
                          return new Promise((resolve, reject) => {
                              setTimeout(() => {
                                  resolve(debugRelax());
                              }, 100);
                          });
                      }
            ];
        }
        case DEBUG_TRIANGULATE: {
            const { edges, importantRooms } = triangulate(state.rooms);
            return [
                {
                    ...state,
                    debugMsg:
                        'Selected "important" rooms. Hit any key to continue.',
                    edges,
                    importantRooms
                },
                () => {
                    return new Promise((resolve, reject) => {
                        window.addEventListener(
                            "keydown",
                            e => {
                                resolve(debugHallways());
                            },
                            { once: true }
                        );
                    });
                }
            ];
        }
        case DEBUG_HALLWAYS: {
            const spannedRooms = bfsPlusExtra(
                state.importantRooms,
                state.edges
            );
            console.log("spanned rooms:");
            console.log(spannedRooms);
            const hallwayRooms = hallways(spannedRooms);
            return [
                {
                    ...state,
                    debugMsg: "Hallways created",
                    dungeon: roomsToDungeon(
                        state.rooms,
                        hallwayRooms,
                        WIDTH,
                        HEIGHT
                    ),
                    hallwayRooms
                },
                () => {}
            ];
        }
        case MOVE_LEFT: {
            const updatedPlayer = {
                ...state.player,
                x: boundX(state.player.x - 1)
            };
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(updatedPlayer, state.dungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                state.memory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    player: updatedPlayer,
                    fov,
                    memory: updatedMemory
                },
                () => {}
            ];
        }
        case MOVE_RIGHT: {
            const updatedPlayer = {
                ...state.player,
                x: boundX(state.player.x + 1)
            };
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(updatedPlayer, state.dungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                state.memory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    player: updatedPlayer,
                    fov,
                    memory: updatedMemory
                },
                () => {}
            ];
        }
        case MOVE_DOWN: {
            const updatedPlayer = {
                ...state.player,
                y: boundY(state.player.y + 1)
            };
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(updatedPlayer, state.dungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                state.memory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    player: updatedPlayer,
                    fov,
                    memory: updatedMemory
                },
                () => {}
            ];
        }
        case MOVE_UP: {
            const updatedPlayer = {
                ...state.player,
                y: boundY(state.player.y - 1)
            };
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(updatedPlayer, state.dungeon);
            const { lightMap, updatedMemory } = light(
                centeredPlayer,
                clippedFOV,
                state.memory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, updatedMemory, lightMap);
            return [
                {
                    ...state,
                    player: updatedPlayer,
                    fov,
                    memory: updatedMemory
                },
                () => {}
            ];
        }
        default:
            return [state, () => {}];
    }
};

export default reducer;
export { initialState };
