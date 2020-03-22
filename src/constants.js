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
    WALL: 17,
    ROCK: 0,
    FLOOR: 1,
    DOOR: 2,
    EXIT_NORTH: 3,
    EXIT_EAST: 4,
    EXIT_SOUTH: 5,
    EXIT_WEST: 6,
    LAKE: 7,
    GRANITE: 8,
    CRYSTAL_WALL: 9,
    LUMINESCENT_FUNGUS: 10,
    GRASS: 11,
    DEAD_GRASS: 12,
    SHALLOW_WATER: 13,
    DEAD_FOLIAGE: 14,
    FOLIAGE: 15,
    RUBBLE: 16
};

export const EXIT_TYPE = CELL_TYPE => {
    return (
        CELL_TYPE <= CELL_TYPES.EXIT_WEST && CELL_TYPE >= CELL_TYPES.EXIT_NORTH
    );
};

export const PASSIBLE_TYPES = [
    CELL_TYPES.FLOOR,
    CELL_TYPES.DOOR,
    CELL_TYPES.SHALLOW_WATER,
    CELL_TYPES.DEAD_GRASS,
    CELL_TYPES.GRASS
];

export const IMPASSIBLE_TYPES = [
    CELL_TYPES.ROCK,
    CELL_TYPES.WALL,
    CELL_TYPES.LAKE,
    CELL_TYPES.FOLIAGE,
    CELL_TYPES.DEAD_FOLIAGE
];

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
    WEST: 3,
    NE: 4,
    SE: 5,
    SW: 6,
    NW: 7
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
    },
    [DIRECTIONS.WEST]: {
        x: -1,
        y: 0
    },
    [DIRECTIONS.NE]: {
        x: 1,
        y: -1
    },
    [DIRECTIONS.SE]: {
        x: 1,
        y: 1
    },
    [DIRECTIONS.SW]: {
        x: -1,
        y: 1
    },
    [DIRECTIONS.NW]: {
        x: -1,
        y: -1
    }
};

// colors
export const COLORS = {
    [CELL_TYPES.FLOOR]: "#bfbfbf",
    [CELL_TYPES.DEBUG]: "#1fa90f",
    [CELL_TYPES.WALL]: "#777463",
    [CELL_TYPES.DOOR]: "#299c32",
    [CELL_TYPES.ROCK]: "#777463",
    [CELL_TYPES.LAKE]: "#5e5eca",
    [CELL_TYPES.SHALLOW_WATER]: "#acade8",
    [CELL_TYPES.GRASS]: { bg: "#23232b", fg: "#8bc34a" },
    [CELL_TYPES.DEAD_GRASS]: { bg: "#23232b", fg: "#8c542b" },
    [CELL_TYPES.DEAD_FOLIAGE]: { bg: "#23232b", fg: "#8c542b" },
    [CELL_TYPES.FOLIAGE]: { bg: "#23232b", fg: "#8bc34a" },
    [CELL_TYPES.RUBBLE: { bg: "#23232b", fg: "black" }
};

// cell types
export const CELLS = {
    [CELL_TYPES.DEBUG]: {
        type: "debug",
        letter: ","
    },
    [CELL_TYPES.FLOOR]: {
        type: "floor",
        color: COLORS.floor,
        letter: ".",
        priority: 9,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.WALL]: {
        type: "wall",
        color: COLORS.wall,
        letter: "#",
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.ROCK]: {
        type: "rock",
        color: COLORS.rock,
        letter: "#",
        priority: 15,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.DOOR]: {
        type: "door",
        color: COLORS.door,
        letter: "+",
        priority: 16,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: true
        }
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
        letter: "~",
        priority: 20,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.SHALLOW_WATER]: {
        type: "shallow_water",
        color: COLORS.shallow_water,
        letter: "~",
        priority: 17,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.GRANITE]: {
        type: "granite",
        color: COLORS.granite,
        letter: "g",
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.CRYSTAL_WALL]: {
        type: "crystal_wall",
        color: COLORS.crystal_wall,
        letter: "c"
    },
    [CELL_TYPES.LUMINESCENT_FUNGUS]: {
        type: "luminescent_fungus",
        color: COLORS.luminescent_fungus,
        letter: "f"
    },
    [CELL_TYPES.GRASS]: {
        type: "grass",
        color: COLORS.grass,
        letter: '"',
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.DEAD_GRASS]: {
        type: "dead_grass",
        color: COLORS.dead_grass,
        letter: '"',
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.DEAD_FOLIAGE]: {
        type: "dead_foliage",
        color: COLORS.dead_grass,
        letter: String.fromCharCode("0x03B3"),
        priority: 12,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.FOLIAGE]: {
        type: "foliage",
        color: COLORS.grass,
        letter: String.fromCharCode("0x03B3"),
        priority: 12,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.RUBBLE]: {
        type: "rubble",
        color: COLORS.grass,
        letter: ",",
        priority: 11,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
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

const FEATURES = {
    DF_GRANITE_COLUMN: 0,
    DF_CRYSTAL_WALL: 1,
    DF_LUMINESCENT_FUNGUS: 2,
    DF_GRASS: 3,
    DF_DEAD_GRASS: 4,
    DF_DEAD_FOLIAGE: 5,
    DF_FOLIAGE: 6
};

export const DUNGEON_FEATURE_CATALOG = {
    [FEATURES.DF_GRANITE_COLUMN]: {
        tile: CELL_TYPES.GRANITE,
        start: 80,
        decr: 70
    },
    [FEATURES.DF_CRYSTAL_WALL]: {
        tile: CELL_TYPES.CRYSTAL_WALL,
        start: 200,
        decr: 50
    },
    [FEATURES.DF_LUMINESCENT_FUNGUS]: {
        tile: CELL_TYPES.DF_LUMINESCENT_FUNGUS,
        start: 60,
        decr: 8
    },
    [FEATURES.DF_GRASS]: {
        tile: CELL_TYPES.GRASS,
        start: 75,
        decr: 10,
        subsequentFeature: FEATURES.DF_FOLIAGE
    },
    [FEATURES.DF_DEAD_GRASS]: {
        tile: CELL_TYPES.DEAD_GRASS,
        start: 75,
        decr: 10,
        propagationTerrain: CELL_TYPES.FLOOR,
        subsequentFeature: FEATURES.DF_DEAD_FOLIAGE
    },
    [FEATURES.DF_DEAD_FOLIAGE]: {
        tile: CELL_TYPES.DEAD_FOLIAGE,
        start: 50,
        decr: 30
    },
    [FEATURES.DF_FOLIAGE]: {
        tile: CELL_TYPES.FOLIAGE,
        start: 50,
        decr: 30
    },
    [FEATURES.DF_RUBBLE]: {
        tile: CELL_TYPES.RUBBLE,
        start: 45,
        decr: 23
    }
};

// terrains
export const AUTO_GENERATOR_CATALOG = [
    //	 terrain layer DF Machine reqDungeon reqLiquid  >Depth <Depth freq minIncp minSlope maxNumber
    // {
    //     terrain: 0,
    //     layer: 0,
    //     DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_GRANITE_COLUMN],
    //     machine: 0,
    //     reqDungeon: CELL_TYPES.FLOOR,
    //     reqLiquid: -1,
    //     minDepth: 0,
    //     maxDepth: 0,
    //     frequency: 60,
    //     minIntercept: 100,
    //     minSlop: 0,
    //     maxNumber: 4
    // },
    // {
    //     terrain: 0,
    //     layer: 0,
    //     DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_CRYSTAL_WALL],
    //     machine: 0,
    //     reqDungeon: CELL_TYPES.ROCK,
    //     reqLiquid: -1,
    //     minDepth: 14,
    //     maxDepth: 0,
    //     frequency: 15,
    //     minIntercept: -325,
    //     minSlop: 25,
    //     maxNumber: 5
    // },
    // {
    //     terrain: 0,
    //     layer: 0,
    //     DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_LUMINESCENT_FUNGUS],
    //     machine: 0,
    //     reqDungeon: CELL_TYPES.FLOOR,
    //     reqLiquid: -1,
    //     minDepth: 0,
    //     maxDepth: 0,
    //     frequency: 15,
    //     minIntercept: -300,
    //     minSlop: 70,
    //     maxNumber: 14
    // },
    {
        terrain: 0,
        layer: 0,
        DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_GRASS],
        machine: 0,
        reqDungeon: CELL_TYPES.FLOOR,
        reqLiquid: -1,
        minDepth: 0,
        maxDepth: 10,
        frequency: 0,
        minIntercept: 1000,
        minSlope: -80,
        maxNumber: 10
    },
    {
        terrain: 0,
        layer: 0,
        DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_DEAD_GRASS],
        machine: 0,
        reqDungeon: CELL_TYPES.FLOOR,
        reqLiquid: -1,
        minDepth: 0,
        maxDepth: 9,
        frequency: 0,
        minIntercept: 500,
        minSlope: 100,
        maxNumber: 10
    },
    // [0, 0, DF_DEAD_GRASS, 0, FLOOR, NOTHING, 9, 14, 0, 1200, -80, 10],
    // [0, 0, DF_BONES, 0, FLOOR, NOTHING, 12, DEEPEST_LEVEL - 1, 30, 0, 0, 4],
    {
        terrain: 0,
        layer: 0,
        DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_RUBBLE],
        machine: 0,
        reqDungeon: CELL_TYPES.FLOOR,
        reqLiquid: -1,
        minDepth: 0,
        maxDepth: 9,
        frequency: 30,
        minIntercept: 0,
        minSlope: 0,
        maxNumber: 4
    }
    // [0, 0, DF_FOLIAGE, 0, FLOOR, NOTHING, 0, 8, 15, 1000, -333, 10],
    // [
    //     0,
    //     0,
    //     DF_FUNGUS_FOREST,
    //     0,
    //     FLOOR,
    //     NOTHING,
    //     13,
    //     DEEPEST_LEVEL,
    //     30,
    //     -600,
    //     50,
    //     12
    // ],
    // [
    //     0,
    //     0,
    //     DF_BUILD_ALGAE_WELL,
    //     0,
    //     FLOOR,
    //     DEEP_WATER,
    //     10,
    //     DEEPEST_LEVEL,
    //     50,
    //     0,
    //     0,
    //     2
    // ],
    // [
    //     STATUE_INERT,
    //     DUNGEON,
    //     0,
    //     0,
    //     WALL,
    //     NOTHING,
    //     6,
    //     DEEPEST_LEVEL - 1,
    //     5,
    //     -100,
    //     35,
    //     3
    // ],
    // [
    //     STATUE_INERT,
    //     DUNGEON,
    //     0,
    //     0,
    //     FLOOR,
    //     NOTHING,
    //     10,
    //     DEEPEST_LEVEL - 1,
    //     50,
    //     0,
    //     0,
    //     3
    // ],
    // [
    //     TORCH_WALL,
    //     DUNGEON,
    //     0,
    //     0,
    //     WALL,
    //     NOTHING,
    //     6,
    //     DEEPEST_LEVEL - 1,
    //     5,
    //     -200,
    //     70,
    //     12
    // ]
];
export const PERLIN_COLORS = {
    [CELL_TYPES.WALL]: {
        baseColor: "#777463",
        variance: {
            r: 50,
            g: 50,
            b: 0
        }
    },
    [CELL_TYPES.DEEP_WATER]: {
        baseColor: "#5FA2EA",
        variance: {
            r: 0,
            g: 107,
            b: 0
        }
    }
};

export const PERLIN_PERIOD = 4;
