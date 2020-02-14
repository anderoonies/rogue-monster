import {
    MOVE_LEFT,
    MOVE_RIGHT,
    MOVE_UP,
    MOVE_DOWN,
    RESIZE,
    RELAX,
    TRIANGULATE,
    INIT
} from "./actions";
import Cell, { floorCell } from "./Cell";
import {
    generateRooms,
    relaxRooms,
    triangulate,
    boundX,
    boundY
} from "./levels/levelCreator.js";

import { scan } from "./light";

const FOV = 10;
const LIGHT_RANGE = 5;

const roomsToDungeon = (rooms, hallwayRooms, player, width, height) => {
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
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    rooms.forEach((room, i) => {
        room = bound(room, width, height);
        for (let row = room.top; row < room.bottom; row++) {
            for (let col = room.left; col < room.right; col++) {
                dungeon[row][col] = {
                    type: "floor",
                    letter: ","
                };
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
                    dungeon[row][x] = {
                        type: "floor",
                        letter: ","
                    };
                }
                break;
            }
            case "horizontal": {
                let { y, left, right } = hallwayRoom;
                for (let col = left; col <= right; col++) {
                    dungeon[y][col] = {
                        type: "floor",
                        letter: ","
                    };
                }
                break;
            }
            case "elbow": {
                let { major, lx, ly, ry, rx } = hallwayRoom;
                if (major === "right") {
                    for (let col = lx; col < rx; col++) {
                        dungeon[ly][col] = {
                            type: "floor",
                            letter: ","
                        };
                    }
                    const ascending = ry < ly;
                    if (ascending) {
                        for (let row = ly; row > ry; row--) {
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ","
                            };
                        }
                    } else {
                        for (let row = ly; row < ry; row++) {
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ","
                            };
                        }
                    }
                } else {
                    for (let col = rx; col > lx; col--) {
                        dungeon[ry][col] = {
                            type: "floor",
                            letter: ","
                        };
                    }
                    const ascending = ly < ry;
                    if (ascending) {
                        for (let row = ry; row >= ly; row--) {
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ","
                            };
                        }
                    } else {
                        for (let row = ry; row <= ly; row++) {
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ","
                            };
                        }
                    }
                }
            }
        }
    });
    return dungeon;
};

const clipFOV = (player, dungeon) => {
    const leftOffset = boundX(player.x - FOV);
    const topOffset = boundY(player.y - FOV);
    const clippedFOV = dungeon
        .slice(boundY(player.y - FOV), boundY(player.y + FOV + 1))
        .map(row => {
            return row.slice(
                boundX(player.x - FOV),
                boundX(player.x + FOV + 1)
            );
        });
    const centeredPlayer = {
        x: Math.floor(FOV),
        y: Math.floor(FOV)
    };
    clippedFOV[centeredPlayer.y][centeredPlayer.y] = { type: "player" };
    return {
        clippedFOV,
        centeredPlayer,
        leftOffset,
        topOffset
    };
};

const light = (player, dungeon, memory, leftOffset, topOffset) => {
    const { lightMap, updatedMemory } = scan(
        player,
        dungeon,
        memory,
        leftOffset,
        topOffset
    );
    // apply memory to the global dungeon
    return { lightMap, updatedMemory };
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

const initialState = {
    dungeon: [[]],
    rooms: [[]],
    viewHeight: 100,
    viewWidth: 100,
    settled: false,
    player: {
        x: 0,
        y: 0
    },
    fov: [[]],
    memory: [[]]
};
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case INIT:
            const [initialRooms, hallwayRooms] = generateRooms({
                radius: 50 - 15,
                nRooms: 200
            });
            const player = {
                x: boundX(initialRooms[0].center.x),
                y: boundY(initialRooms[0].center.y)
            };
            const initialDungeon = roomsToDungeon(
                initialRooms,
                hallwayRooms,
                player,
                100,
                100
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
            return {
                ...state,
                dungeon: initialDungeon,
                rooms: initialRooms,
                settled: true,
                fov,
                player,
                memory: updatedMemory
            };
        case MOVE_LEFT: {
            const updatedPlayer = {
                ...state.player,
                x: state.player.x - 1
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
            return {
                ...state,
                player: updatedPlayer,
                fov,
                memory: updatedMemory
            };
        }
        case MOVE_RIGHT: {
            const updatedPlayer = {
                ...state.player,
                x: state.player.x + 1
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
            return {
                ...state,
                player: updatedPlayer,
                fov,
                memory: updatedMemory
            };
        }
        case MOVE_DOWN: {
            const updatedPlayer = {
                ...state.player,
                y: state.player.y + 1
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
            return {
                ...state,
                player: updatedPlayer,
                fov,
                memory: updatedMemory
            };
        }
        case MOVE_UP: {
            const updatedPlayer = {
                ...state.player,
                y: state.player.y - 1
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
            return {
                ...state,
                player: updatedPlayer,
                fov,
                memory: updatedMemory
            };
        }
        case TRIANGULATE:
            triangulate(state.rooms);
            return state;
        default:
            return state;
    }
};

export default reducer;
export { initialState };
