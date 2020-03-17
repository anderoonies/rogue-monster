// global
export const CELL_WIDTH = 1;
export const FOV = 30;

// light
export const BRIGHT_THRESHOLD = 10;
export const DIM_THRESHOLD = 30;
export const DARK_THRESHOLD = 60;
export const DARKNESS_MAX = 100;
export const LIGHT_RANGE = 5;

// # and flags~
export const DEBUG_FLAGS = {
    DEBUG: true,
    ROOMS_ONLY: false,
    SHOW_ACCRETION: false,
    SHOW_CA: false
};

export const WIDTH = DEBUG_FLAGS.SHOW_CA || DEBUG_FLAGS.ROOMS_ONLY ? 50 : 60;
export const HEIGHT = DEBUG_FLAGS.SHOW_CA || DEBUG_FLAGS.ROOMS_ONLY ? 50 : 50;

// colors
export const COLORS = {
    floor: "#bfbfbf",
    debug: "#1fa90f",
    wall: "#777463",
    player: "#299c32",
    door: "#299c32",
    rock: "#777463",
    hallway: "#bfbfbf",
    lake: "#5e5eca",
    shallow_water: "#acade8"
};

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
    CA: 0,
    CIRCLE: 1,
    SYMMETRICAL_CROSS: 2
};

export const CELL_TYPES = {
    DEBUG: -10,
    ROCK: 0,
    FLOOR: 1,
    DOOR: 2,
    EXIT_NORTH: 3,
    EXIT_EAST: 4,
    EXIT_SOUTH: 5,
    EXIT_WEST: 6,
    LAKE: 7
};

export const EXIT_TYPE = CELL_TYPE => {
    return (
        CELL_TYPE <= CELL_TYPES.EXIT_WEST && CELL_TYPE >= CELL_TYPES.EXIT_NORTH
    );
};

export const PASSIBLE_TYPES = [
    CELL_TYPES.FLOOR,
    CELL_TYPES.DOOR,
    CELL_TYPES.SHALLOW_WATER
];

export const IMPASSIBLE_TYPES = [CELL_TYPES.ROCK, CELL_TYPES.LAKE];

export const IMPASSIBLE = cell => {
    return IMPASSIBLE_TYPES.indexOf(cell) > -1;
};

export const PASSIBLE = cell => {
    return PASSIBLE_TYPES.indexOf(cell) > -1;
};

export const HALLWAY_CHANCE = 0.15;
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

// cell types
export const CELLS = {
    [CELL_TYPES.DEBUG]: {
        type: "debug",
        color: COLORS.debug,
        letter: ","
    },
    [CELL_TYPES.FLOOR]: {
        type: "floor",
        color: COLORS.floor,
        letter: ","
    },
    [CELL_TYPES.ROCK]: {
        type: "rock",
        color: COLORS.rock,
        letter: "#"
    },
    [CELL_TYPES.DOOR]: {
        type: "door",
        color: COLORS.door,
        letter: "d"
    },
    [CELL_TYPES.EXIT_NORTH]: {
        type: "door",
        color: COLORS.door,
        letter: "^"
    },
    [CELL_TYPES.EXIT_EAST]: {
        type: "door",
        color: COLORS.door,
        letter: ">"
    },
    [CELL_TYPES.EXIT_SOUTH]: {
        type: "door",
        color: COLORS.door,
        letter: "V"
    },
    [CELL_TYPES.EXIT_WEST]: {
        type: "door",
        color: COLORS.door,
        letter: "<"
    },
    [CELL_TYPES.LAKE]: {
        type: "lake",
        color: COLORS.lake,
        letter: "~"
    },
    [CELL_TYPES.SHALLOW_WATER]: {
        type: "shallow_water",
        color: COLORS.shallow_water,
        letter: "`"
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
        ROOM_GENERATION: {
            [0]: [
                {
                    adjacentType: 1,
                    // will turn
                    into: 1,
                    // if there are
                    operator: operators.gte,
                    nNeighbors: 5
                }
            ],
            [1]: [
                {
                    adjacentType: 1,
                    into: 0,
                    operator: operators.lt,
                    nNeighbors: 2
                }
            ]
        },
        LAKE_GENERATION: {
            // "ffffftttt", "ffffttttt"
            [0]: [
                {
                    adjacentType: 1,
                    into: 1,
                    operator: operators.gte,
                    nNeighbors: 5
                }
            ],
            [1]: [
                {
                    adjacentType: 1,
                    into: 0,
                    operator: operators.lte,
                    nNeighbors: 4
                }
            ]
        }
    }
};

export const DIRECTION_TO_DOOR_LETTER = {
    [DIRECTIONS.NORTH]: "^",
    [DIRECTIONS.EAST]: ">",
    [DIRECTIONS.SOUTH]: "V",
    [DIRECTIONS.WEST]: "<"
};
