import {
    MOVE,
    RESIZE,
    DEBUG_RELAX,
    DEBUG_TRIANGULATE,
    INIT,
    DEBUG_INIT,
    DEBUG_HALLWAYS,
    ACCRETION_INIT,
    DEBUG_FIND_ROOM_PLACEMENT,
    DEBUG_ADD_ROOM,
    CLICK
} from "./actions";
import Cell, { floorCell } from "./Cell";
import {
    accreteRooms,
    flattenHyperspaceIntoDungeon,
    designRoomInHyperspace,
    annotateCells,
    placeRoomInDungeon
} from "./levels/levelCreator.js";
import {
    debugRelax,
    debugHallways,
    debugTriangulate,
    accretionInit,
    debugFindRoomPlacement,
    debugAddRoom
} from "./actions";
import { boundX, boundY, gridFromDimensions } from "./utils";
import { scan } from "./light";
import { FOV, WIDTH, HEIGHT, DEBUG_SHOW_ACCRETION } from "./constants";
import { pathDistance, traceShortestPath } from "./levels/dijkstra";

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

// const initialRooms = generateRooms({
//     radius: 50,
//     nRooms: 150
// });
// const player = {
//     x: boundX(initialRooms[0].center.x),
//     y: boundY(initialRooms[0].center.y)
// };
// const initialDungeon = roomsToDungeon(initialRooms, [], WIDTH, HEIGHT);
// const initialMemory = new Array(initialDungeon.length)
//     .fill(undefined)
//     .map(row => {
//         return new Array(initialDungeon[0].length).fill(undefined);
//     });
// const { clippedFOV, centeredPlayer, leftOffset, topOffset } = clipFOV(
//     player,
//     initialDungeon
// );
// const { lightMap, updatedMemory, clippedMemory } = light(
//     centeredPlayer,
//     clippedFOV,
//     initialMemory,
//     leftOffset,
//     topOffset
// );
// const fov = flatten(clippedFOV, clippedMemory, lightMap);

const initialDungeonInProgress = gridFromDimensions(HEIGHT, WIDTH, 0);
const { dungeon, dungeonRaw } = DEBUG_SHOW_ACCRETION
    ? accreteRooms([], 0, initialDungeonInProgress)
    : {
          dungeon: annotateCells(initialDungeonInProgress),
          dungeonRaw: initialDungeonInProgress
      };

const initialState = {
    rooms: [],
    dungeon: [[]],
    viewHeight: HEIGHT,
    viewWidth: WIDTH,
    settled: false,
    finalized: false,
    player: {},
    fov: [[]],
    memory: [[]],
    dungeonInProgress: dungeonRaw,
    dungeon: dungeon,
    displayDungeon: dungeon,
    dijkstraLeft: undefined,
    dijkstraRight: undefined,
    debugMsg:
        "This is my initial dungeon room (: Hit any key to add another room."
};
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case INIT:
            // const [initialRooms, hallwayRooms] = finalizeRooms({
            //     radius: 50,
            //     nRooms: 150
            // });
            // const player = {
            //     x: boundX(initialRooms[0].center.x),
            //     y: boundY(initialRooms[0].center.y)
            // };
            // const initialDungeon = roomsToDungeon(
            //     initialRooms,
            //     hallwayRooms,
            //     WIDTH,
            //     HEIGHT
            // );
            // const initialMemory = new Array(initialDungeon.length)
            //     .fill(undefined)
            //     .map(row => {
            //         return new Array(initialDungeon[0].length).fill(undefined);
            //     });
            // const {
            //     clippedFOV,
            //     centeredPlayer,
            //     leftOffset,
            //     topOffset
            // } = clipFOV(player, initialDungeon);
            // const { lightMap, updatedMemory, clippedMemory } = light(
            //     centeredPlayer,
            //     clippedFOV,
            //     initialMemory,
            //     leftOffset,
            //     topOffset
            // );
            // const fov = flatten(clippedFOV, clippedMemory, lightMap);
            return [
                {
                    ...state
                    // dungeon: initialDungeon,
                    // rooms: initialRooms,
                    // hallwayRooms,
                    // settled: true,
                    // fov,
                    // player,
                    // memory: updatedMemory
                },
                () => {}
            ];
        case DEBUG_FIND_ROOM_PLACEMENT: {
            let dungeon = placeRoomInDungeon(
                state.pendingRoom.hyperspace,
                state.dungeonInProgress,
                state.pendingRoom.doorSites,
                true
            );
            let annotatedDungeon = annotateCells(dungeon);
            return [
                {
                    ...state,
                    dungeon: annotatedDungeon,
                    displayDungeon: annotatedDungeon,
                    dungeonInProgress: dungeon,
                    debugMsg: "I put the room here (:"
                },
                () => {
                    return new Promise((resolve, reject) => {
                        window.addEventListener(
                            "keydown",
                            e => {
                                debugger;
                                if (e.code === "Space") {
                                    resolve(debugAddRoom());
                                }
                            },
                            { once: true }
                        );
                    });
                }
            ];
        }
        case DEBUG_ADD_ROOM: {
            const { hyperspace, doorSites } = designRoomInHyperspace();
            const dungeon = annotateCells(
                flattenHyperspaceIntoDungeon(
                    hyperspace,
                    gridFromDimensions(HEIGHT, WIDTH, 0),
                    0,
                    0
                )
            );
            return [
                {
                    ...state,
                    dungeon,
                    displayDungeon: dungeon,
                    pendingRoom: {
                        hyperspace,
                        doorSites
                    },
                    debugMsg: "I created this room (:"
                },
                () => {
                    return new Promise((resolve, reject) => {
                        window.addEventListener(
                            "keydown",
                            e => {
                                if (e.code === "Space") {
                                    resolve(debugFindRoomPlacement());
                                }
                            },
                            { once: true }
                        );
                    });
                }
            ];
        }
        case ACCRETION_INIT: {
            const { rooms, dungeon } = accreteRooms([], 45, undefined);
            return [
                {
                    ...state,
                    debugMsg:
                        "Generated a dungeon. Hit space to make a new one.",
                    dungeon,
                    rooms,
                    displayDungeon: dungeon,
                    settled: false,
                    fov: [],
                    player: {},
                    memory: [[]]
                },
                () => {}
            ];
        }
        case MOVE: {
            const transform = action.transform;
            const updatedPlayer = {
                ...state.player
                // y: boundY(state.player.y + transform.y),
                // x: boundX(state.player.x + transform.x)
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
        case CLICK: {
            debugger;
            let annotatedDungeon = state.dungeon.map(row => {
                return row.map(cell => {
                    return { ...cell };
                });
            });
            if (action.which === "left") {
                state = {
                    ...state,
                    dijkstraLeft: {
                        x: action.x,
                        y: action.y
                    }
                };
                annotatedDungeon[state.dijkstraLeft.y][
                    state.dijkstraLeft.x
                ].letter = "l";
            } else {
                state = {
                    ...state,
                    dijkstraRight: {
                        x: action.x,
                        y: action.y
                    }
                };
                annotatedDungeon[state.dijkstraRight.y][
                    state.dijkstraRight.x
                ].letter = "r";
            }
            if (state.dijkstraLeft && state.dijkstraRight) {
                const { distance, nodeMap } = pathDistance({
                    start: state.dijkstraLeft,
                    end: state.dijkstraRight,
                    dungeon: annotatedDungeon,
                    inaccessible: cell => {
                        return cell.type === "rock";
                    }
                });
                let path;
                // nodeMap.forEach((row, rowIndex) =>
                //     row.forEach((node, colIndex) => {
                //         if (node.distance < Infinity)
                //             annotatedDungeon[rowIndex][colIndex].letter =
                //                 node.distance;
                //     })
                // );
                if (distance !== Infinity) {
                    path = traceShortestPath(
                        nodeMap,
                        state.dijkstraLeft,
                        state.dijkstraRight
                    );
                }
                if (path) {
                    path.forEach(node => {
                        annotatedDungeon[node.y][node.x].letter = "o";
                    });
                }
                return [
                    {
                        ...state,
                        debugMsg: `It's ${distance} between [${state.dijkstraLeft.y}, ${state.dijkstraLeft.x}] and [${state.dijkstraRight.y}, ${state.dijkstraRight.x}]`,
                        displayDungeon: annotatedDungeon
                    },
                    () => {}
                ];
            } else {
                return [
                    { ...state, displayDungeon: annotatedDungeon },
                    () => {}
                ];
            }
        }
        default:
            return [state, () => {}];
    }
};

export default reducer;
export { initialState };
