// global
export const WIDTH = 200;
export const HEIGHT = 150;
export const CELL_WIDTH = 1;
export const FOV = 30;

// light
export const BRIGHT_THRESHOLD = 10;
export const DIM_THRESHOLD = 30;
export const DARK_THRESHOLD = 60;
export const DARKNESS_MAX = 100;
export const LIGHT_RANGE = 5;

// # and flags~
export const DEBUG = true;

// colors
export const COLORS = {
    floor: "#bfbfbf",
    wall: "#777463",
    player: "#299c32",
    rock: "#777463",
    hallway: "#bfbfbf",
};

// cell types
export const CELLS = {
    floor: {
        type: 'floor',
        color: COLORS.floor,
        letter: ',',
    },
    rock: {
        type: 'rock',
        color: COLORS.rock,
        letter: '#',
    },
}

// rooms
export const ROOM_MIN_WIDTH = 4;
export const ROOM_MAX_WIDTH = 20;
export const ROOM_MIN_HEIGHT = 3;
export const ROOM_MAX_HEIGHT = 7;
export const HORIZONTAL_CORRIDOR_MIN_LENGTH = 5;
export const HORIZONTAL_CORRIDOR_MAX_LENGTH = 15;
export const VERTICAL_CORRIDOR_MIN_LENGTH = 2;
export const VERTICAL_CORRIDOR_MAX_LENGTH = 9;

export const ROOM_TYPES = {
    CA: 0
};
export const HALLWAY_CHANCE = .15;
export const DIRECTIONS = {
    NO_DIRECTION: -1,
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
};

export const DIR_TO_TRANSFORM = {
    [DIRECTIONS.NORTH]: {
        x: 0,
        y: -1
    },
    [DIRECTIONS.SOUTH]: {
        x: 0,
        y: 1
    },
    [DIRECTIONS.EAST]: {
        x: 1,
        y: 0
    },
    [DIRECTIONS.WEST]: {
        x: -1,
        y: 0
    }
};

// CA constants
const operators = {
    lt: {
        fn: (a, b) => {
            return a < b;
        },
        string: "less than"
    },
    gt: {
        fn: (a, b) => {
            return a > b;
        },
        string: "greater than"
    },
    lte: {
        fn: (a, b) => {
            return a <= b;
        },
        string: "less than or equal to"
    },
    gte: {
        fn: (a, b) => {
            return a >= b;
        },
        string: "greater than or equal to"
    },
    eq: {
        fn: (a, b) => {
            return a === b;
        },
        string: "equal to"
    }
};

export const CA = {
    rules: {
        [0]: [
            {
                adjacentType: 1,
                // will turn
                into: 1,
                // if there are
                operator: operators.gte,
                nNeighbors: 5
            },
            {
                adjacentType: 0,
                into: 1,
                operator: operators.lt,
                nNeighbors: 2
            }
        ],
        [1]: [
            {
                adjacentType: 0,
                into: 0,
                operator: operators.gte,
                nNeighbors: 4
            }
        ]
    }
};

export const DIRECTION_TO_DOOR_LETTER = {
    [DIRECTIONS.NORTH]: "^",
    [DIRECTIONS.EAST]: ">",
    [DIRECTIONS.SOUTH]: "V",
    [DIRECTIONS.WEST]: "<"
};
