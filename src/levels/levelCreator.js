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
const WIDTH = require("../constants").WIDTH;
const HEIGHT = require("../constants").HEIGHT;

const {
    coordinatesAreInMap,
    clamp,
    boundX,
    boundY,
    gridFromDimensions
} = require("../utils");

const pathDistance = require("./dijkstra").pathDistance;

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
    let copiedGrid = grid.map(row => {
        return row.map(cell => {
            if (typeof cell === "object") {
                return Object.assign({}, cell);
            } else {
                return cell;
            }
        });
    });
    for (let row = 0; row < room.length; row++) {
        for (let col = 0; col < room[0].length; col++) {
            if (room[row][col]) {
                if (typeof map === "function") {
                    copiedGrid[row + topOffset][col + leftOffset] = map(
                        room[row][col]
                    );
                } else {
                    copiedGrid[row + topOffset][col + leftOffset] =
                        room[row][col];
                }
            }
        }
    }
    return copiedGrid;
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
    } else {
        return 0;
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

const runCA = ({ width, height, rules, nIterations, startingPercent }) => {
    let cells = new Array(height).fill(0).map(row => {
        return new Array(width).fill(0);
    });
    // fill the cells with random initial values
    cells = cells.map((row, rowIndex) => {
        return row.map(cell => {
            return Math.random() > (startingPercent ? startingPercent : 0.5)
                ? 1
                : 0;
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
        const cellRules = rules[cellState];
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

    for (let tick = 0; tick < nIterations; tick++) {
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

    let minY = -1;
    let minX = -1;
    let maxY = -1;
    let maxX = -1;
    let blobHeight = 0;
    let blobWidth = 0;

    for (let row = 0; row < paintedRoom.length; row++) {
        for (let col = 0; col < paintedRoom[0].length; col++) {
            if (paintedRoom[row][col]) {
                if (minY === -1 && minX === -1) {
                    minY = row;
                    minX = row;
                }
                if (row > maxY) {
                    maxY = row;
                }
                if (col > maxX) {
                    maxX = col;
                }
            }
        }
    }

    return { blob: paintedRoom, minX, minY, maxX, maxY };
};

const makeCARoom = () => {
    const width = randomRange(5, 12);
    const height = randomRange(5, 12);

    let { blob } = runCA({
        width,
        height,
        rules: CA_RULES.ROOM_GENERATION,
        nIterations: 5
    });
    return blob;
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

const lakeDisruptsPassability = ({ dungeon, lake, y, x }) => {
    let transform;
    let adjacentCell;
    let adjacentRow;
    let adjacentCol;
    let dungeonWithLake = drawContinuousShapeOnGrid(
        lake,
        y,
        x,
        dungeon,
        cell => {
            return cell === 1 ? CELL_TYPES.LAKE : 0;
        }
    );
    // generate a perimeter of the lake:
    // all the non-lake cells to the left/top/right/bottom of a lake cell.
    // perimeter cells are adjusted to the dungeon
    let perimeterCells = new Set();
    for (let row = 0; row < lake.length; row++) {
        for (let col = 0; col < lake[0].length; col++) {
            if (lake[row][col] === 1) {
                for (let direction = 0; direction < 4; direction++) {
                    transform = DIR_TO_TRANSFORM[direction];
                    adjacentRow = y + row + transform.y;
                    adjacentCol = x + col + transform.x;
                    adjacentCell = dungeonWithLake[adjacentRow][adjacentCol];
                    if (adjacentCell === 1) {
                        perimeterCells.add([adjacentRow, adjacentCol]);
                    }
                }
            }
        }
    }
    perimeterCells = Array.from(perimeterCells);
    // now, for each cell in the perimeter, perform a walk.
    let walk;
    let startCell;
    let endCell;
    // i from 0 to n - 1
    for (let i = 0; i < perimeterCells.length - 1; i++) {
        startCell = perimeterCells[i];
        endCell = perimeterCells[i + 1];
        debugger;
        walk = pathDistance({
            start: {
                y: startCell[0],
                x: startCell[1]
            },
            end: {
                y: endCell[0],
                x: endCell[1]
            },
            dungeon: dungeonWithLake,
            inaccessible: cell => {
                return cell === CELL_TYPES.ROCK || cell === CELL_TYPES.LAKE;
            }
        });
        if (walk.distance === Infinity) {
            // console.log(`${startCell} -> ${endCell} is inaccessible`);
            return true;
        } else {
            // console.log(`${startCell} -> ${endCell} is ACCESSIBLE`);
        }
    }
    return false;
};

const addLakes = dungeon => {
    let lakeMap = gridFromDimensions(HEIGHT, WIDTH, 0);
    let hyperspace = gridFromDimensions(HEIGHT, WIDTH, 0);
    let lake;
    let lakeMinY, lakeMinX, lakeHeight, lakeWidth;
    let proposedLakeX, proposedLakeY;
    let blob, minX, minY, maxX, maxY;

    for (
        let lakeMaxHeight = 50, lakeMaxWidth = 50;
        lakeMaxWidth >= 10;
        lakeMaxHeight--, lakeMaxWidth -= 2
    ) {
        ({ blob, minX, minY, maxX, maxY } = runCA({
            width: 30,
            height: 15,
            rules: CA_RULES.LAKE_GENERATION,
            nIterations: 6,
            startingPercent: 0.45
        }));

        lakeHeight = maxY - minY;
        lakeWidth = maxX - minX;
        for (let k = 0; k < 20; k++) {
            proposedLakeY = randomRange(
                1 - minY,
                HEIGHT - lakeHeight - minY - 2
            );
            proposedLakeX = randomRange(1 - minX, WIDTH - lakeWidth - minX - 2);

            if (
                !lakeDisruptsPassability({
                    dungeon,
                    lake: blob,
                    y: proposedLakeY,
                    x: proposedLakeX
                })
            ) {
                dungeon = drawContinuousShapeOnGrid(
                    blob,
                    proposedLakeY,
                    proposedLakeX,
                    dungeon,
                    cell => {
                        return cell === 1 ? CELL_TYPES.LAKE : 0;
                    }
                );
                break;
            }
        }
    }
    return dungeon;
};

const addLoops = dungeon => {
    let randomizedCoordinates = Array.from(Array(WIDTH * HEIGHT).keys());
    randomizedCoordinates = shuffleList(randomizedCoordinates);

    let row, col, transform, opposite;
    let forwardX, forwardY, behindX, behindY, forwardSpace, behindSpace;
    let walkDistance;
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        row = randomizedCoordinates[i] % HEIGHT;
        col = Math.floor(randomizedCoordinates[i] / HEIGHT);

        if (dungeon[row][col] > 0) {
            continue;
        }

        for (let direction = 0; direction < 2; direction++) {
            transform = DIR_TO_TRANSFORM[direction];
            forwardX = col + transform.x;
            forwardY = row + transform.y;
            behindX = col - transform.x;
            behindY = row - transform.y;

            if (
                !(
                    coordinatesAreInMap(forwardY, forwardX) &&
                    coordinatesAreInMap(behindY, behindX)
                )
            ) {
                continue;
            }

            forwardSpace = dungeon[forwardY][forwardX];
            behindSpace = dungeon[behindY][behindX];

            if (forwardSpace === 0 || behindSpace === 0) {
                continue;
            }

            walkDistance = pathDistance({
                start: { x: forwardX, y: forwardY },
                end: { x: behindX, y: behindY },
                dungeon: dungeon,
                inaccessible: cell => {
                    return cell === 0;
                }
            });

            if (walkDistance.distance > 20) {
                dungeon[row][col] = CELL_TYPES.DOOR;
            }
        }
    }
    return dungeon;
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
    dungeon = addLoops(dungeon);
    dungeon = addLakes(dungeon);
    return {
        rooms,
        dungeon: annotateCells(dungeon),
        dungeonRaw: dungeon
    };
};

module.exports = {
    boundX,
    boundY,
    designRoomInHyperspace,
    accreteRooms,
    flattenHyperspaceIntoDungeon,
    placeRoomInDungeon,
    gridFromDimensions,
    annotateCells,
    coordinatesAreInMap
};
