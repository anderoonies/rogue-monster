// this module implements procedural dungeon generation using the techniques in
// https://gamasutra.com/blogs/AAdonaac/20150903/252889/Procedural_Dungeon_Generation_Algorithm.php
// import {WIDTH, HEIGHT} from './constants'
// this is a circular import? ^
const Delaunator = require("delaunator").default;
const COLORS = require("../constants").COLORS;
const CA_RULES = require("../constants").CA.rules;
const ROOM_TYPES = require("../constants").ROOM_TYPES;
const HALLWAY_CHANCE = require("../constants").HALLWAY_CHANCE;
const DIRECTIONS = require("../constants").DIRECTIONS;
const DIR_TO_TRANSFORM = require("../constants").DIR_TO_TRANSFORM;
const DIRECTION_TO_DOOR_LETTER = require("../constants")
    .DIRECTION_TO_DOOR_LETTER;

const HORIZONTAL_CORRIDOR_MIN_LENGTH = require("../constants")
    .HORIZONTAL_CORRIDOR_MIN_LENGTH;
const HORIZONTAL_CORRIDOR_MAX_LENGTH = require("../constants")
    .HORIZONTAL_CORRIDOR_MAX_LENGTH;
const VERTICAL_CORRIDOR_MIN_LENGTH = require("../constants")
    .VERTICAL_CORRIDOR_MIN_LENGTH;
const VERTICAL_CORRIDOR_MAX_LENGTH = require("../constants")
    .VERTICAL_CORRIDOR_MAX_LENGTH;

const CELLS = require("../constants").CELLS;
const CELL_TYPES = require("../constants").CELL_TYPES;
const EXIT_TYPE = require("../constants").EXIT_TYPE;
const DEBUG_SHOW_ACCRETION = require("../constants").DEBUG_SHOW_ACCRETION;

const CELL_WIDTH = 1;
const WIDTH = 100;
const HEIGHT = 50;

const clamp = (x, min, max) => {
    return Math.min(max, Math.max(x, min));
};

const boundX = value => {
    return clamp(value, 0, WIDTH);
};

const boundY = value => {
    return clamp(value, 0, HEIGHT);
};

const gridFromDimensions = (height, width, value) => {
    return new Array(height).fill(value).map(row => {
        return new Array(width).fill(value);
    });
};

const coordinatesAreInMap = (row, col, dungeon) => {
    if (dungeon === undefined) {
        return row >= 0 && row < HEIGHT && col >= 0 && col < WIDTH;
    } else {
        return (
            row >= 0 &&
            row < dungeon.length &&
            col >= 0 &&
            col < dungeon[0].length
        );
    }
};

const randColorFrom = (baseColor, range) => {
    const f = parseInt(baseColor.slice(1), 16);
    const deviation = (Math.random() < 0.5 ? -1 : 1) * randn(0, range, 1);
    const R = f >> 16;
    const G = (f >> 8) & 0x00ff;
    const B = f & 0x0000ff;
    const rAdd = R + deviation;
    const gAdd = G + deviation;
    const bAdd = B + deviation;
    const componentToHex = c => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return (
        "#" +
        componentToHex(Math.max(0, Math.min(255, Math.round(rAdd, 2)))) +
        componentToHex(Math.max(0, Math.min(255, Math.round(gAdd, 2)))) +
        componentToHex(Math.max(0, Math.min(255, Math.round(bAdd, 2))))
    );
};

const randn = (min, max, skew) => {
    // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 5.0 + 0.5;
    num = Math.pow(num, skew);
    num *= max - min;
    num += min;
    return num;
};

const randomRange = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const randomRangeInclusive = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleList = l => {
    for (let i = 0; i < l.length; i++) {
        const j = randomRange(0, l.length - 1);
        if (i !== j) {
            let temp = l[j];
            l[j] = l[i];
            l[i] = temp;
        }
    }
    return l;
};

const drawContinuousShapeOnGrid = (room, topOffset, leftOffset, grid, map) => {
    for (let row = 0; row < room.length; row++) {
        for (let col = 0; col < room[0].length; col++) {
            if (room[row][col]) {
                if (typeof map === "function") {
                    grid[row + topOffset][col + leftOffset] = map(
                        room[row][col]
                    );
                } else {
                    grid[row + topOffset][col + leftOffset] = room[row][col];
                }
            }
        }
    }
    return grid;
};

const drawDoorCoordinatesOnGrid = (coordinates, grid) => {
    coordinates.forEach(coordinate => {
        if (coordinate)
            grid[coordinate.y][coordinate.x] = 3 + coordinate.direction;
    });
    return grid;
};

const makeSymmetricalCrossRoom = () => {
    const majorWidth = randomRange(4, 9);
    const majorHeight = randomRange(4, 6);
    let minorWidth = randomRange(4, 6);
    let minorHeight = majorHeight - 1;
    if (majorHeight % 2 === 0) {
        minorWidth -= 1;
    }

    if (majorWidth % 2 === 0) {
        minorHeight -= 1;
    }
    console.log(
        `majorWidth: ${majorWidth}, majorHeight: ${majorHeight}, minorWidth: ${minorWidth}, minorHeight: ${minorHeight}`
    );

    let hyperspace = gridFromDimensions(majorHeight, majorWidth, 0);
    for (let row = 0; row < majorHeight; row++) {
        for (let col = 0; col < majorWidth; col++) {
            if (
                row >= majorHeight / 2 - minorHeight / 2 &&
                row < majorHeight / 2 + minorHeight / 2
            ) {
                hyperspace[row][col] = 1;
            }
            if (
                col >= majorWidth / 2 - minorWidth / 2 &&
                col < majorWidth / 2 + minorWidth / 2
            ) {
                hyperspace[row][col] = 1;
            }
        }
    }
    return hyperspace;
};

const makeCircularRoom = () => {
    let radius;
    if (Math.random() < 0.05) {
        // BIG circle
        radius = randomRange(4, 10);
    } else {
        radius = randomRange(2, 4);
    }
    console.log(`r = ${radius}`);
    const grid = gridFromDimensions(radius * 2, radius * 2, 0);
    const center = [radius, radius];
    let roomGrid = grid.map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
            // |xp - xc|^2 + |yp - yc|^2 < r^2
            const dx = colIndex - radius;
            const dy = rowIndex - radius;
            if (Math.pow(dy, 2) + Math.pow(dx, 2) < Math.pow(radius, 2)) {
                return CELL_TYPES.FLOOR;
            } else {
                return CELL_TYPES.ROCK;
            }
        });
    });
    if (radius > 6 && Math.random() < 0.5) {
        // add a bulge
        const bulge = makeCircularRoom();
        const topOffset = randomRange(3, radius - 3);
        const leftOffset = randomRange(3, radius - 3);
        // copy the room over to a bigger grid
        let expandedGrid = gridFromDimensions(
            grid.length + bulge.length + 10,
            grid[0].length + bulge[0].length + 10,
            0
        );
        expandedGrid = drawContinuousShapeOnGrid(roomGrid, 0, 0, expandedGrid);
        roomGrid = drawContinuousShapeOnGrid(
            bulge,
            topOffset,
            leftOffset,
            expandedGrid
        );
    }
    return roomGrid;
};

const makeRectangularRoom = () => {
    const roomWidth = randomRange(3, 12);
    const roomHeight = randomRange(3, 12);
    return gridFromDimensions(roomHeight, roomWidth, CELL_TYPES.FLOOR);
};

const fillBlob = (hyperspace, row, col, fillValue) => {
    if (hyperspace[row][col] === 1) {
        hyperspace[row][col] = fillValue;
    }
    let newRow = 0;
    let newCol = 0;
    let blobSize = 1;
    let transform;
    for (let direction = 0; direction < 4; direction++) {
        transform = DIR_TO_TRANSFORM[direction];
        newRow = row + transform.y;
        newCol = col + transform.x;
        if (
            coordinatesAreInMap(newRow, newCol, hyperspace) &&
            hyperspace[newRow][newCol] === 1
        ) {
            blobSize += fillBlob(hyperspace, newRow, newCol, fillValue);
        }
    }
    return blobSize;
};

const makeCARoom = () => {
    const width = randomRange(5, 12);
    const height = randomRange(5, 12);

    let cells = new Array(height).fill(0).map(row => {
        return new Array(width).fill(0);
    });
    // fill the cells with random initial values
    cells = cells.map((row, rowIndex) => {
        return row.map(cell => {
            return Math.random() > 0.5 ? 1 : 0;
        });
    });

    const getCellNeighbors = (row, col) => {
        let neighbors = [];
        for (
            let x = Math.max(0, row - 1);
            x <= Math.min(row + 1, height - 1);
            x++
        ) {
            for (
                let y = Math.max(0, col - 1);
                y <= Math.min(col + 1, width - 1);
                y++
            ) {
                if (x !== row || y !== col) {
                    neighbors.push(cells[x][y]);
                }
            }
        }
        return neighbors;
    };

    const transformCell = (cellState, neighbors) => {
        const cellRules = CA_RULES[cellState];
        let newCellState = cellState;
        if (cellRules) {
            cellRules.forEach(
                ({ adjacentType, into, operator, nNeighbors }) => {
                    const nNeighborsOfType = neighbors.filter(cellState => {
                        if (Array.isArray(adjacentType)) {
                            return adjacentType.indexOf(cellState) > -1;
                        } else {
                            return cellState === adjacentType;
                        }
                    }).length;
                    if (operator.fn(nNeighborsOfType, nNeighbors)) {
                        newCellState = into;
                    }
                }
            );
        }
        return newCellState;
    };

    for (let tick = 0; tick < 5; tick++) {
        cells = cells.map((rowState, row) => {
            return rowState.map((cell, col) => {
                const neighbors = getCellNeighbors(row, col);
                const newCell = transformCell(cell, neighbors);
                return newCell;
            });
        });
    }

    // CA rooms can be discontinous. find the largest blob, painting each with
    // its own number. when the largest blob is found, just mask that blob
    // number onto the grid.
    let topBlobSize = 0;
    let topBlobNumber = 2;
    let blobNumber = 2;
    let blobSize;

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            blobSize = fillBlob(cells, row, col, blobNumber);
            if (blobSize > topBlobSize) {
                topBlobSize = blobSize;
                topBlobNumber = blobNumber;
            }
            blobNumber++;
        }
    }

    let paintingGrid = gridFromDimensions(height, width, 0);
    const paintedRoom = drawContinuousShapeOnGrid(
        cells,
        0,
        0,
        paintingGrid,
        function(cell) {
            return cell === topBlobNumber ? 1 : 0;
        }
    );
    return paintedRoom;
};

const roomFitsAt = (dungeon, hyperspace, topOffset, leftOffset) => {
    let xDungeon;
    let yDungeon;
    for (let yRoom = 0; yRoom < HEIGHT; yRoom++) {
        for (let xRoom = 0; xRoom < WIDTH; xRoom++) {
            if (
                hyperspace[yRoom][xRoom] &&
                !EXIT_TYPE(hyperspace[yRoom][xRoom])
            ) {
                // map the coordinates of the room in hypserpsace
                // to coordinates of the room in the dungeon
                yDungeon = yRoom + topOffset;
                xDungeon = xRoom + leftOffset;

                // confirm no overlaps in the 8x8 neighbors
                for (let i = yDungeon - 1; i <= yDungeon + 1; i++) {
                    for (let j = xDungeon - 1; j <= xDungeon + 1; j++) {
                        if (
                            !coordinatesAreInMap(i, j) ||
                            !(
                                dungeon[i][j] === CELL_TYPES.ROCK ||
                                EXIT_TYPE(dungeon[i][j])
                            )
                        ) {
                            return false;
                        }
                    }
                }
            }
        }
    }
    return true;
};

const directionOfDoorSite = (grid, row, col) => {
    if (grid[row][col] !== 0) {
        return DIRECTIONS.NO_DIRECTION;
    }
    let solutionDirection = DIRECTIONS.NO_DIRECTION;
    let newRow, newCol, oppRow, oppCol, transform;
    for (let direction = 0; direction < 4; direction++) {
        transform = DIR_TO_TRANSFORM[direction];
        newCol = col + transform.x;
        newRow = row + transform.y;
        oppCol = col - transform.x;
        oppRow = row - transform.y;
        if (
            coordinatesAreInMap(oppRow, oppCol) &&
            coordinatesAreInMap(newRow, newCol) &&
            grid[oppRow][oppCol] !== 0
        ) {
            solutionDirection = direction;
        }
    }
    return solutionDirection;
};

const chooseRandomDoorSites = room => {
    // the room is copied from hyperspace onto the center of a map to do
    // geometry calculations
    let grid = gridFromDimensions(HEIGHT, WIDTH, 0);
    let leftOffset = WIDTH / 2;
    let topOffset = HEIGHT / 2;
    let doorSites = [];
    grid = drawContinuousShapeOnGrid(room, topOffset, leftOffset, grid);
    let traceRow, traceCol, transform, doorSiteFailed;
    for (let row = 0; row < HEIGHT; row++) {
        for (let col = 0; col < WIDTH; col++) {
            if (grid[row][col] === 0) {
                let doorDirection = directionOfDoorSite(grid, row, col);
                if (doorDirection === DIRECTIONS.NO_DIRECTION) {
                    continue;
                }
                // trace 10 spaces outward from the door to confirm it doesn't intersect
                // with the room.
                // TODO: why 10?
                doorSiteFailed = false;
                transform = DIR_TO_TRANSFORM[doorDirection];
                traceRow = row + transform.y;
                traceCol = col + transform.x;
                for (
                    let i = 0;
                    i < 10 &&
                    coordinatesAreInMap(traceRow, traceCol) &&
                    !doorSiteFailed;
                    i++
                ) {
                    if (grid[traceRow][traceCol] !== 0) {
                        doorSiteFailed = true;
                    }
                    traceRow += transform.y;
                    traceCol += transform.x;
                }
                if (!doorSiteFailed) {
                    doorSites = doorSites.concat({
                        x: col,
                        y: row,
                        type: "door",
                        letter: DIRECTION_TO_DOOR_LETTER[doorDirection],
                        color: "red",
                        direction: doorDirection
                    });
                }
            }
        }
    }
    let chosenDoors = new Array(4).fill(undefined);
    for (let direction = 0; direction < 4; direction++) {
        const doorsFactingThatDirection = doorSites.filter(
            door => door.direction === direction
        );
        chosenDoors[direction] =
            doorsFactingThatDirection[
                Math.floor(Math.random() * doorsFactingThatDirection.length)
            ];
    }
    return chosenDoors;
};

const attachHallwayTo = (room, doorSites, hyperspace) => {
    const hallwayDirections = shuffleList([0, 1, 2, 3]);
    let hallwayDirection;
    let i;
    for (i = 0; i < 4; i++) {
        hallwayDirection = hallwayDirections[i];
        if (
            doorSites[hallwayDirection] &&
            coordinatesAreInMap(
                doorSites[hallwayDirection].y +
                    DIR_TO_TRANSFORM[hallwayDirection].y *
                        VERTICAL_CORRIDOR_MAX_LENGTH,
                doorSites[hallwayDirection].x +
                    DIR_TO_TRANSFORM[hallwayDirection].x *
                        HORIZONTAL_CORRIDOR_MAX_LENGTH
            )
        ) {
            break;
        }
    }

    if (i == 4) {
        return { room, hyperspace };
    }

    const transform = DIR_TO_TRANSFORM[hallwayDirection];
    let hallwayLength;
    if (
        hallwayDirection === DIRECTIONS.NORTH ||
        hallwayDirection === DIRECTIONS.SOUTH
    ) {
        hallwayLength = randomRange(
            VERTICAL_CORRIDOR_MIN_LENGTH,
            VERTICAL_CORRIDOR_MAX_LENGTH
        );
    } else {
        hallwayLength = randomRange(
            HORIZONTAL_CORRIDOR_MIN_LENGTH,
            HORIZONTAL_CORRIDOR_MAX_LENGTH
        );
    }

    let x = doorSites[hallwayDirection].x;
    let y = doorSites[hallwayDirection].y;
    for (i = 0; i < hallwayLength; i++) {
        if (coordinatesAreInMap(y, x)) {
            hyperspace[y][x] = CELL_TYPES.FLOOR;
        }
        x += transform.x;
        y += transform.y;
    }
    // all door sites except the opposite direction of the door
    // now need to be at the end of the hallway.
    y = clamp(y - transform.y, 0, HEIGHT - 1);
    x = clamp(x - transform.x, 0, WIDTH - 1);
    // for each of the doors, move the door to the end of the hallway.
    for (let doorDirection = 0; doorDirection < 4; doorDirection++) {
        let doorTransform = DIR_TO_TRANSFORM[doorDirection];
        if (doorDirection !== oppositeDirection(hallwayDirection)) {
            let doorY = y + doorTransform.y;
            let doorX = x + doorTransform.x;
            doorSites[doorDirection].y = doorY;
            doorSites[doorDirection].x = doorX;
        } else {
            doorSites[doorDirection] = undefined;
        }
    }

    return { hyperspace, doorSites };
};

const designRoomInHyperspace = () => {
    // project onto hyperspace
    let hyperspace = gridFromDimensions(HEIGHT, WIDTH, CELL_TYPES.ROCK);
    const roomType = randomRangeInclusive(0, 2);
    let room;
    switch (roomType) {
        // case ROOM_TYPES.CA:
        //     room = makeCARoom();
        //     break;
        // case ROOM_TYPES.CIRCLE:
        //     room = makeCircularRoom();
        //     break;
        // case ROOM_TYPES.SYMMETRICAL_CROSS:
        //     room = makeSymmetricalCrossRoom();
        //     break;
        default:
            room = makeCARoom();
            // room = makeSymmetricalCrossRoom();
            break;
    }
    hyperspace = drawContinuousShapeOnGrid(
        room,
        HEIGHT / 2,
        WIDTH / 2,
        hyperspace
    );

    let doorSites = chooseRandomDoorSites(room);
    if (Math.random() < HALLWAY_CHANCE) {
        ({ hyperspace, doorSites } = attachHallwayTo(
            room,
            doorSites,
            hyperspace
        ));
    }
    if (doorSites) {
        hyperspace = drawDoorCoordinatesOnGrid(doorSites, hyperspace);
    }
    return { hyperspace, doorSites };
};

const flattenHyperspaceIntoDungeon = (
    hyperspace,
    dungeon,
    topOffset,
    leftOffset
) => {
    topOffset = topOffset || 0;
    leftOffset = leftOffset || 0;
    for (let row = 0; row < HEIGHT; row++) {
        for (let col = 0; col < WIDTH; col++) {
            if (
                coordinatesAreInMap(row + topOffset, col + leftOffset) &&
                hyperspace[row][col] !== CELL_TYPES.ROCK
            ) {
                dungeon[row + topOffset][col + leftOffset] =
                    hyperspace[row][col];
            }
        }
    }
    return dungeon;
};

const oppositeDirection = direction => {
    switch (direction) {
        case DIRECTIONS.NORTH:
            return DIRECTIONS.SOUTH;
        case DIRECTIONS.SOUTH:
            return DIRECTIONS.NORTH;
        case DIRECTIONS.EAST:
            return DIRECTIONS.WEST;
        case DIRECTIONS.WEST:
            return DIRECTIONS.EAST;
        case DIRECTIONS.NO_DIRECTION:
            return DIRECTIONS.NO_DIRECTION;
        default:
            return DIRECTIONS.NO_DIRECTION;
    }
};

const transferRoomToDungeon = (dungeon, hyperspace, topOffset, leftOffset) => {
    for (let row = 0; row < HEIGHT; row++) {
        for (let col = 0; col < WIDTH; col++) {
            if (
                hyperspace[row][col] !== 0 &&
                !EXIT_TYPE(hyperspace[row][col])
            ) {
                dungeon[row + topOffset][col + leftOffset] =
                    hyperspace[row][col];
            }
        }
    }
    return dungeon;
};

const insertRoomAt = (
    dungeon,
    hyperspace,
    topOffset,
    leftOffset,
    yRoom,
    xRoom
) => {
    // i dont understand this weird recursive function yet but i'm gonna go for it
    // alright so this recursive thing makes sense for water filling but it sucks in JS.

    // i can use this to check if CA rooms are continuou :)

    // don't draw exits
    if (!EXIT_TYPE(hyperspace[yRoom][xRoom])) {
        dungeon[yRoom + topOffset][xRoom + leftOffset] =
            hyperspace[yRoom][xRoom];
    }
    let newY, newX, transform;
    for (let dir = 0; dir < 4; dir++) {
        transform = DIR_TO_TRANSFORM[dir];
        newY = yRoom + transform.y;
        newX = xRoom + transform.x;
        if (
            coordinatesAreInMap(newY, newX, hyperspace) &&
            hyperspace[newY][newX] &&
            coordinatesAreInMap(newY + topOffset, newX + leftOffset) &&
            dungeon[newY + topOffset][newX + leftOffset] === CELL_TYPES.ROCK
        ) {
            dungeon = insertRoomAt(
                dungeon,
                hyperspace,
                topOffset,
                leftOffset,
                newY,
                newX
            );
        }
    }

    return dungeon;
};

const placeRoomInDungeon = (hyperspace, dungeon, doorSites) => {
    // "slide hyperspace across real space, in a random but predetermined order, until
    // the room matches up with a wall."
    let randomizedCoordinates = Array.from(Array(WIDTH * HEIGHT).keys());
    randomizedCoordinates = shuffleList(randomizedCoordinates);
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        const row = randomizedCoordinates[i] % HEIGHT;
        const col = Math.floor(randomizedCoordinates[i] / HEIGHT);
        const direction = directionOfDoorSite(dungeon, row, col);
        const oppDirection = oppositeDirection(direction);
        // the "opposite direction door" is this room's door, and it's being aligned
        // with another room's door.
        if (
            oppDirection !== DIRECTIONS.NO_DIRECTION &&
            doorSites[oppDirection] !== undefined &&
            roomFitsAt(
                dungeon,
                hyperspace,
                row - doorSites[oppDirection].y,
                col - doorSites[oppDirection].x
            )
        ) {
            dungeon = transferRoomToDungeon(
                dungeon,
                hyperspace,
                row - doorSites[oppDirection].y,
                col - doorSites[oppDirection].x
            );
            dungeon[row][col] = CELL_TYPES.DOOR;
            break;
        }
    }
    return dungeon;
};

const annotateCells = dungeon => {
    // map to cells for rendering
    return dungeon.map((row, rowIndex) => {
        return row.map((celltype, colIndex) => {
            const annotatedCell = CELLS[celltype];
            return {
                ...annotatedCell,
                row: rowIndex,
                col: colIndex
            };
        });
    });
};

const accreteRoom = dungeon => {
    let { hyperspace, doorSites } = designRoomInHyperspace();
    dungeon = placeRoomInDungeon(hyperspace, dungeon, doorSites);
    return dungeon;
};

const accreteRooms = (rooms, nRooms, dungeon) => {
    if (dungeon === undefined) {
        dungeon = gridFromDimensions(HEIGHT, WIDTH, 0);
    }
    let { hyperspace, doorSites } = designRoomInHyperspace();
    // the initial room is put smack in the center
    let fillX, fillY;
    let foundFillPoint = false;
    for (fillY = 0; fillY < HEIGHT && !foundFillPoint; fillY++) {
        for (fillX = 0; fillX < WIDTH && !foundFillPoint; fillX++) {
            if (hyperspace[fillY][fillX]) {
                foundFillPoint = true;
            }
        }
    }
    dungeon = transferRoomToDungeon(dungeon, hyperspace, 0, 0);
    for (let i = 0; i < nRooms; i++) {
        dungeon = accreteRoom(dungeon);
    }
    return {
        rooms,
        dungeon: annotateCells(dungeon),
        dungeonRaw: dungeon
    };
};

module.exports = {
    // generateRooms,
    // triangulate,
    boundX,
    boundY,
    // finalizeRooms,
    // relaxRooms,
    // makeHallways,
    // bfsPlusExtra,
    // roomsToDungeon,
    // hallways,
    designRoomInHyperspace,
    accreteRooms,
    flattenHyperspaceIntoDungeon,
    placeRoomInDungeon,
    gridFromDimensions,
    annotateCells,
    coordinatesAreInMap
};

// const draw = rooms => {
//     let screen = blessed.screen({
//         fastCSR: true,
//         dockBorders: false
//     });
//
//     const box = blessed.box({
//         top: 0,
//         left: 0,
//         width: "100%",
//         height: "100%"
//     });
//
//     screen.append(box);
//     rooms.forEach((room, index) => {
//         const roomBox = blessed.box({
//             top: room.top,
//             left: room.left,
//             width: room.right - room.left,
//             height: room.bottom - room.top,
//             border: {
//                 type: "line"
//             },
//             style: {
//                 fg: "white",
//                 bg: "magenta",
//                 transparent: true,
//                 border: {
//                     fg: "#f0f0f0"
//                 }
//             }
//         });
//         screen.append(roomBox);
//     });
//
//     // Focus our element.
//     box.focus();
//
//     // Render the screen.
//     screen.render();
//
//     // Quit on Escape, q, or Control-C.
//     screen.key(["escape", "q", "C-c"], function(ch, key) {
//         return process.exit(0);
//     });
// };
//
// const snapRooms = rooms => {
//     return rooms.map(room => {
//         return {
//             ...room,
//             top: Math.round(room.top, 2),
//             bottom: Math.round(room.bottom, 2),
//             left: Math.round(room.left, 2),
//             right: Math.round(room.right, 2),
//             center: {
//                 x: Math.round(room.center.x, 2),
//                 y: Math.round(room.center.y, 2)
//             }
//         };
//     });
// };
//
//
//
// let Vector = function({ x, y }) {
//     this.x = x;
//     this.y = y;
// };
//
// Vector.prototype.add = function(v) {
//     return new Vector({
//         x: this.x + v.x,
//         y: this.y + v.y
//     });
// };
//
// Vector.prototype.subtract = function(v) {
//     return new Vector({
//         x: this.x - v.x,
//         y: this.y - v.y
//     });
// };
//
// Vector.prototype.length = function() {
//     return Math.sqrt(this.x ** 2 + this.y ** 2);
// };
//
// Vector.prototype.div = function(v) {
//     if (typeof v === "number") {
//         return new Vector({ x: this.x / v, y: this.y / v });
//     }
//     return new Vector({ x: this.x / v.x, y: this.y / v.y });
// };
//
// Vector.prototype.scale = function(v) {
//     return new Vector({ x: this.x * v, y: this.y * v });
// };
//
// const bound = ({ top, left, bottom, right }) => {
//     return {
//         top: snap(Math.min(top, HEIGHT)),
//         left: snap(Math.max(0, left)),
//         right: snap(Math.min(right, WIDTH)),
//         bottom: snap(Math.max(0, bottom))
//     };
// };
//
//
// const snap = distance => {
//     return distance > 0
//         ? Math.round(distance + 0.5)
//         : Math.round(distance - 0.5);
// };
//
// const between = (x, a, b) => {
//     return x > a && x < b;
// };
//
// const middle = (a, b) => {
//     return Math.round((a + b) / 2);
// };
//
// const cartesianToGrid = ({ x, y }) => {
//     return {
//         x: boundX(snap(x + Math.floor(WIDTH / 2))),
//         y: boundY(snap(Math.floor(HEIGHT / 2) - y))
//     };
// };
//
// const generateRooms = ({ radius, nRooms }) => {
//     const randomPointInCircle = radius => {
//         const angle = Math.random() * 2 * Math.PI;
//         const pointRSquared = Math.random() * radius * radius;
//         const pointX = Math.sqrt(pointRSquared) * Math.cos(angle);
//         const pointY = Math.sqrt(pointRSquared) * Math.sin(angle);
//         const center = {
//             x: pointX,
//             y: pointY
//         };
//         return cartesianToGrid(center);
//     };
//
//     const rooms = new Array(nRooms).fill(undefined).map((_, index) => {
//         const center = randomPointInCircle(radius);
//         const width = Math.floor(randn(MIN_WIDTH, 10, 2));
//         const height = Math.floor(
//             randn(MIN_WIDTH, width * MAX_WIDTH_TO_HEIGHT, 2)
//         );
//         let leftEdge = Math.round(center.x - width / 2);
//         let rightEdge = Math.round(center.x + width / 2);
//         let topEdge = Math.round(center.y - height / 2);
//         let bottomEdge = Math.round(center.y + height / 2);
//
//         // snap to edges properly
//         if (bottomEdge >= HEIGHT) {
//             bottomEdge = HEIGHT;
//             topEdge = bottomEdge - height;
//         }
//
//         if (rightEdge >= WIDTH) {
//             rightEdge = WIDTH;
//             leftEdge = rightEdge - width;
//         }
//
//         if (leftEdge <= 0) {
//             leftEdge = 0;
//             rightEdge = leftEdge + width;
//         }
//
//         if (topEdge <= 0) {
//             topEdge = 0;
//             bottomEdge = topEdge + height;
//         }
//
//         const room = {
//             index: index,
//             top: boundY(topEdge),
//             bottom: boundY(bottomEdge),
//             left: boundX(leftEdge),
//             right: boundX(rightEdge),
//             center: center
//         };
//
//         return {
//             ...room
//         };
//     });
//
//     return rooms;
// };
//
// // returns an array of objects with shape
// // { top: number, bottom: number, left: number, right: number }
// const finalizeRooms = ({ radius, nRooms }) => {
//     const rooms = generateRooms({ radius, nRooms });
//     let [relaxedRooms, updated] = relaxRooms(rooms);
//     let nRelaxations = 0;
//     while (nRelaxations < 1000 && updated) {
//         [relaxedRooms, updated] = relaxRooms(relaxedRooms);
//         nRelaxations++;
//     }
//     return [relaxedRooms, makeHallways(relaxedRooms)];
// };
//
// const makeHallways = rooms => {
//     const { edges, importantRooms } = triangulate(rooms);
//     const spannedRooms = bfsPlusExtra(rooms, edges);
//     const hallwayRooms = hallways(spannedRooms);
//     return hallwayRooms;
// };
//
// const intersect = (roomA, roomB) => {
//     return !(
//         roomA.right < roomB.left ||
//         roomA.left > roomB.right ||
//         roomA.top > roomB.bottom ||
//         roomA.bottom < roomB.top
//     );
// };
//
// const relaxRooms = rooms => {
//     // deep copy
//     rooms = [...rooms];
//     const roomBodies = [...rooms].map(room => {
//         return {
//             ...room,
//             force: new Vector({ x: 0, y: 0 }),
//             neighbors: 0
//         };
//     });
//
//     let updated = false;
//
//     for (let i = 0; i < roomBodies.length; i++) {
//         const agent = roomBodies[i];
//         for (let j = 0; j < roomBodies.length; j++) {
//             if (i === j) {
//                 continue;
//             }
//             const neighbor = roomBodies[j];
//             if (intersect(agent, neighbor)) {
//                 const separation = new Vector(agent.center).subtract(
//                     neighbor.center
//                 );
//                 if (separation.x === 0)
//                     separation.x = (1 - 2 * Math.random()) * 0.5;
//                 if (separation.y === 0)
//                     separation.y = (1 - 2 * Math.random()) * 0.5;
//                 const agentWidth = agent.right - agent.left + 2;
//                 const agentHeight = agent.bottom - agent.top + 2;
//                 const xHeading = separation.x < 0 ? -1 : 1;
//                 const yHeading = separation.y < 0 ? -1 : 1;
//                 const pushForce = new Vector({
//                     x:
//                         xHeading < 0
//                             ? separation.x - agentWidth
//                             : separation.x + agentWidth,
//                     y:
//                         yHeading < 0
//                             ? separation.y - agentHeight
//                             : separation.y + agentHeight
//                 });
//                 const mass = agentWidth * agentHeight;
//                 const totalForce = agent.force.add(pushForce.div(mass / 2));
//                 agent.force = totalForce;
//                 updated = true;
//                 agent.neighbors++;
//             }
//         }
//         if (
//             agent.neighbors > 0 &&
//             (agent.force.x === 0 || agent.force.y === 0)
//         ) {
//             agent.force = new Vector({
//                 x: 1 - FORCE_SCALE * Math.random(),
//                 y: 1 - FORCE_SCALE * Math.random()
//             });
//         }
//         agent.force = agent.force.div(Math.max(1, agent.neighbors));
//     }
//     for (let i = 0; i < roomBodies.length; i++) {
//         let room = rooms[i];
//         let body = roomBodies[i];
//         let force = { x: snap(body.force.x), y: snap(body.force.y) };
//
//         rooms[i] = {
//             ...room,
//             center: {
//                 x: room.center.x + force.x,
//                 y: room.center.y + force.y
//             },
//             left: room.left + force.x,
//             right: room.right + force.x,
//             top: room.top + force.y,
//             bottom: room.bottom + force.y
//         };
//     }
//     return [rooms, updated];
// };
//
// const triangulate = rooms => {
//     const importantRooms = rooms.filter(room => {
//         const width = room.right - room.left;
//         const height = room.bottom - room.top;
//         return (
//             width >= IMPORTANT_WIDTH &&
//             height >= IMPORTANT_HEIGHT &&
//             width / height > 0.5
//         );
//     });
//     const centers = importantRooms.map(room => {
//         return [room.center.x, room.center.y];
//     });
//     const centerToRoomIndex = importantRooms.reduce((acc, room) => {
//         acc[`${room.center.x},${room.center.y}`] = room.index;
//         return acc;
//     }, {});
//     const delaunay = Delaunator.from(centers);
//     const triangles = delaunay.triangles;
//     let coordinates = [];
//     let edges = [];
//     for (let i = 0; i < triangles.length; i += 3) {
//         coordinates.push([
//             centers[triangles[i]],
//             centers[triangles[i + 1]],
//             centers[triangles[i + 2]]
//         ]);
//         let center1 = centers[triangles[i]];
//         let center2 = centers[triangles[i + 1]];
//         let center3 = centers[triangles[i + 2]];
//         let room1Index = centerToRoomIndex[`${center1[0]},${center1[1]}`];
//         let room2Index = centerToRoomIndex[`${center2[0]},${center2[1]}`];
//         let room3Index = centerToRoomIndex[`${center3[0]},${center3[1]}`];
//         edges.push(
//             [room1Index, room2Index],
//             [room2Index, room3Index],
//             [room3Index, room1Index]
//         );
//     }
//     return { edges, importantRooms };
// };
//
// const bfsPlusExtra = (rooms, edges) => {
//     // nodes = {
//     //     roomIndex: {
//     //         parents: [roomIndex],
//     //         visited: boolean,
//     //         neighbors: [room]
//     //     }
//     // }
//     let nodes = rooms.reduce((acc, room, index) => {
//         acc[room.index] = {
//             parents: [],
//             visited: false,
//             neighbors: [],
//             index: room.index
//         };
//         return acc;
//     }, {});
//
//     let roomLookup = rooms.reduce((acc, room) => {
//         acc[room.index] = room;
//         return acc;
//     }, {});
//
//     // edges =  {
//     //     roomIndex: [room]
//     // }
//     nodes = edges.reduce((acc, [left, right]) => {
//         acc[left].neighbors.push(nodes[right]);
//         return acc;
//     }, nodes);
//
//     // 1  procedure BFS(G, start_v) is
//     // 2      let Q be a queue
//     // 3      label start_v as discovered
//     // 4      Q.enqueue(start_v)
//     // 5      while Q is not empty do
//     // 6          v := Q.dequeue()
//     // 7          if v is the goal then
//     // 8              return v
//     // 9          for all edges from v to w in G.adjacentEdges(v) do
//     // 10             if w is not labeled as discovered then
//     // 11                 label w as discovered
//     // 12                 w.parent := v
//     // 13                 Q.enqueue(w)
//     let queue = [];
//     let start = nodes[Object.keys(nodes)[0]];
//     start.visited = true;
//     queue.push(start);
//     while (queue.length) {
//         let v = queue.shift();
//         let neighbors = v.neighbors;
//         neighbors.forEach(neighbor => {
//             if (!neighbor.visited) {
//                 neighbor.visited = true;
//                 neighbor.parents.push(v.index);
//                 queue.push(neighbor);
//             }
//         });
//     }
//     edges.forEach(([left, right]) => {
//         if (Math.random() < 0.3) {
//             nodes[left].parents.push(right);
//         }
//     });
//     // annotate parents on the [rooms] array
//     const annotatedRooms = rooms.map(room => {
//         let parents = nodes[room.index].parents.map(idx => {
//             return roomLookup[idx];
//         });
//         return { ...room, parents };
//     });
//
//     return annotatedRooms;
// };
//
// const hallways = rooms => {
//     // im just a kid and this code is a nightmare
//     let hallways = rooms.reduce((halls, room) => {
//         const parents = room.parents;
//         const roomHalls = parents.map(parent => {
//             if (!parent) {
//                 return;
//             }
//             let hall;
//             const [topRoom, bottomRoom] =
//                 room.bottom < parent.top ? [room, parent] : [parent, room];
//             const [leftRoom, rightRoom] =
//                 room.right < parent.left ? [room, parent] : [parent, room];
//
//             if (
//                 // (topRoom.right <= bottomRoom.right &&
//                 //     topRoom.right >= bottomRoom.left) ||
//                 // (topRoom.left >= bottomRoom.left && topRoom.left <= bottomRoom.right)
//                 between(topRoom.left, bottomRoom.left, bottomRoom.right - 1) ||
//                 between(topRoom.right, bottomRoom.left, bottomRoom.right - 1) ||
//                 between(bottomRoom.right, topRoom.left, topRoom.right - 1) ||
//                 between(bottomRoom.right, topRoom.left, topRoom.right - 1)
//             ) {
//                 // |______|
//                 //    ______
//                 //   |      |
//                 //  or
//                 //   |______|
//                 // ______
//                 //|      |
//                 // vertical hallway 1
//                 const hallX = Math.min(
//                     Math.max(rightRoom.left, leftRoom.left),
//                     Math.min(rightRoom.right, leftRoom.right)
//                 );
//                 return {
//                     bottom: boundY(bottomRoom.top - 1),
//                     top: boundY(topRoom.bottom),
//                     orientation: "vertical",
//                     x: boundX(hallX),
//                     debugName: `${bottomRoom.index}${topRoom.index}`
//                 };
//             } else if (
//                 // (leftRoom.bottom <= rightRoom.bottom &&
//                 //     leftRoom.bottom >= rightRoom.top) ||
//                 // (leftRoom.top <= rightRoom.bottom && leftRoom.top >= rightRoom.top)
//                 between(leftRoom.top, rightRoom.bottom, rightRoom.top) ||
//                 between(leftRoom.bottom, rightRoom.bottom, rightRoom.top) ||
//                 between(rightRoom.bottom, leftRoom.bottom, leftRoom.top) ||
//                 between(rightRoom.top, leftRoom.bottom, leftRoom.top)
//             ) {
//                 // _
//                 //  |  _
//                 //  | |
//                 // _| |
//                 //    |_
//                 //
//                 //  or
//                 //
//                 //     _
//                 //    |
//                 // _  |
//                 //  | |_
//                 //  |
//                 // _|
//                 const hallY = middle(topRoom.bottom, bottomRoom.top);
//                 return {
//                     left: boundX(leftRoom.right + 1),
//                     right: boundX(rightRoom.left - 1),
//                     orientation: "horizontal",
//                     y: boundY(hallY),
//                     debugName: `${leftRoom.index}${rightRoom.index}`
//                 };
//             } else {
//                 // elbow
//                 const [leftRoom, rightRoom] =
//                     room.left < parent.left ? [room, parent] : [parent, room];
//                 const [topRoom, bottomRoom] =
//                     room.bottom < parent.top ? [room, parent] : [parent, room];
//
//                 // RIGHT MAJOR
//                 // LT --
//                 //      |
//                 //      RB
//                 //  or
//                 //      RT
//                 //      |
//                 // LB --
//
//                 // UP MAJOR
//                 //  -- RT
//                 // |
//                 // LB
//                 //  or
//                 // LT
//                 //  |
//                 //   -- RB
//                 const major = leftRoom.center.x < WIDTH / 2 ? "right" : "up";
//                 const ascending = rightRoom.bottom < leftRoom.top;
//                 return {
//                     orientation: "elbow",
//                     major,
//                     lx:
//                         major === "right"
//                             ? boundX(leftRoom.right - 1)
//                             : boundX(leftRoom.center.x),
//                     rx:
//                         major === "right"
//                             ? boundX(rightRoom.center.x)
//                             : boundX(rightRoom.left - 1),
//                     ry:
//                         major === "right"
//                             ? ascending
//                                 ? boundY(rightRoom.bottom - 1)
//                                 : boundY(rightRoom.top)
//                             : boundY(rightRoom.center.y),
//                     ly:
//                         major === "right"
//                             ? boundY(leftRoom.center.y)
//                             : ascending
//                             ? boundY(leftRoom.top - 1)
//                             : boundY(leftRoom.bottom)
//                 };
//             }
//         });
//         return halls.concat(roomHalls);
//     }, []);
//     return hallways.filter(hall => hall !== undefined);
// };
//
// const roomsToDungeon = (rooms, hallwayRooms, width, height) => {
//     let dungeon = new Array(height).fill(undefined).map(row => {
//         return new Array(width)
//             .fill({
//                 type: "rock",
//                 letter: "#"
//             })
//             .map(rock => {
//                 return { ...rock, color: randColorFrom(COLORS.rock, 10) };
//             });
//     });
//     const bound = (room, width, height) => {
//         return {
//             ...room,
//             top: Math.max(0, room.top),
//             bottom: Math.min(height, room.bottom),
//             left: Math.max(0, room.left),
//             right: Math.min(width, room.right),
//             center: {
//                 x: Math.min(width, Math.max(0, room.center.x)),
//                 y: Math.min(height, Math.max(0, room.center.y))
//             }
//         };
//     };
//     rooms.forEach((room, i) => {
//         room = bound(room, width, height);
//         for (let row = room.top; row < room.bottom; row++) {
//             for (let col = room.left; col < room.right; col++) {
//                 dungeon[row][col] = {
//                     type: "floor",
//                     letter: ",",
//                     color: randColorFrom(COLORS.floor, 5),
//                     debugLetter: i
//                 };
//             }
//         }
//     });
//     hallwayRooms.forEach((hallwayRoom, i) => {
//         if (!hallwayRoom) {
//             return;
//         }
//         switch (hallwayRoom.orientation) {
//             case "vertical": {
//                 let { x, bottom, top } = hallwayRoom;
//                 for (let row = bottom; row >= top; row--) {
//                     dungeon[row][x] = {
//                         type: "floor",
//                         letter: ",",
//                         color: randColorFrom(COLORS.floor, 5),
//                         debugLetter: "v"
//                     };
//                 }
//                 break;
//             }
//             case "horizontal": {
//                 let { y, left, right } = hallwayRoom;
//                 for (let col = left; col <= right; col++) {
//                     dungeon[y][col] = {
//                         type: "floor",
//                         letter: ",",
//                         color: randColorFrom(COLORS.floor, 5),
//                         debugLetter: "h"
//                     };
//                 }
//                 break;
//             }
//             case "elbow": {
//                 let { major, lx, ly, ry, rx } = hallwayRoom;
//                 if (major === "right") {
//                     for (let col = lx; col < rx; col++) {
//                         dungeon[ly][col] = {
//                             type: "floor",
//                             letter: ",",
//                             color: randColorFrom(COLORS.floor, 5),
//                             debugLetter: "r"
//                         };
//                     }
//                     const ascending = ry < ly;
//                     if (ascending) {
//                         for (let row = ly; row > ry; row--) {
//                             dungeon[row][rx] = {
//                                 type: "floor",
//                                 letter: ",",
//                                 color: randColorFrom(COLORS.floor, 5),
//                                 debugLetter: "ra"
//                             };
//                         }
//                     } else {
//                         for (let row = ly; row < ry; row++) {
//                             dungeon[row][rx] = {
//                                 type: "floor",
//                                 letter: ",",
//                                 color: randColorFrom(COLORS.floor, 5),
//                                 debugLetter: "rd"
//                             };
//                         }
//                     }
//                 } else {
//                     for (let col = rx; col > lx; col--) {
//                         dungeon[ry][col] = {
//                             type: "floor",
//                             letter: ",",
//                             color: randColorFrom(COLORS.floor, 5),
//                             debugLetter: "u"
//                         };
//                     }
//                     const ascending = ly < ry;
//                     if (ascending) {
//                         for (let row = ry; row >= ly; row--) {
//                             dungeon[row][lx] = {
//                                 type: "floor",
//                                 letter: ",",
//                                 color: randColorFrom(COLORS.floor, 5),
//                                 debugLetter: "ua"
//                             };
//                         }
//                     } else {
//                         for (let row = ry; row <= ly; row++) {
//                             dungeon[row][lx] = {
//                                 type: "floor",
//                                 letter: ",",
//                                 color: randColorFrom(COLORS.floor, 5),
//                                 debugLetter: "ud"
//                             };
//                         }
//                     }
//                 }
//                 break;
//             }
//             default:
//                 break;
//         }
//     });
//     return dungeon;
// };
