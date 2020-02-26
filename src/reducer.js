import {
    MOVE,
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
    roomsToDungeon,
    bfsPlusExtra
} from "./levels/levelCreator.js";
import { debugRelax, debugHallways, debugTriangulate } from "./actions";
import { scan } from "./light";
import { FOV, WIDTH, HEIGHT } from "./constants";

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
    const clippedMemory = new Array(localMemory.length)
        .fill(undefined)
        .map(row => {
            return new Array(localMemory[0].length).fill(undefined);
        });
    for (let row = 0; row < localMemory.length; row++) {
        for (let col = 0; col < localMemory[0].length; col++) {
            if (localMemory[row][col]) {
                globalMemory[row + topOffset][col + leftOffset] =
                    localMemory[row][col];
            }
            clippedMemory[row][col] =
                localMemory[row][col] ||
                globalMemory[row + topOffset][col + leftOffset];
        }
    }
    return {
        lightMap,
        updatedMemory: globalMemory,
        clippedMemory: clippedMemory
    };
};

const flatten = (clippedFOV, clippedMemory, light) => {
    let annotatedFOV = [...clippedFOV];
    for (let row = 0; row < clippedFOV.length; row++) {
        for (let col = 0; col < clippedFOV[0].length; col++) {
            annotatedFOV[row][col] = {
                ...clippedFOV[row][col],
                light: light[row][col],
                memory: clippedMemory[row][col],
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
const { lightMap, updatedMemory, clippedMemory } = light(
    centeredPlayer,
    clippedFOV,
    initialMemory,
    leftOffset,
    topOffset
);
const fov = flatten(clippedFOV, clippedMemory, lightMap);

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
            const { lightMap, updatedMemory, clippedMemory } = light(
                centeredPlayer,
                clippedFOV,
                initialMemory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, clippedMemory, lightMap);
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
            const { lightMap, updatedMemory, clippedMemory } = light(
                centeredPlayer,
                clippedFOV,
                initialMemory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, clippedMemory, lightMap);
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
        case MOVE: {
            const transform = action.transform;
            const updatedPlayer = {
                ...state.player,
                y: boundY(state.player.y + transform.y),
                x: boundX(state.player.x + transform.x)
            };
            const {
                clippedFOV,
                centeredPlayer,
                leftOffset,
                topOffset
            } = clipFOV(updatedPlayer, state.dungeon);
            const { lightMap, updatedMemory, clippedMemory } = light(
                centeredPlayer,
                clippedFOV,
                state.memory,
                leftOffset,
                topOffset
            );
            const fov = flatten(clippedFOV, clippedMemory, lightMap);
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
