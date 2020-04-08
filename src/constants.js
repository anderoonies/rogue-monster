// global
export const CELL_WIDTH = 1;
export const FOV = 10;

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

export const WIDTH = DEBUG_FLAGS.SHOW_CA || DEBUG_FLAGS.ROOMS_ONLY ? 50 : 80;
export const HEIGHT = DEBUG_FLAGS.SHOW_CA || DEBUG_FLAGS.ROOMS_ONLY ? 50 : 32;

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
    EMPTY: -1,
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
    RUBBLE: 16,
    TORCH_WALL: 18,
    HAZE: 19,
    LIGHT_POOL: 20
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
    FLOOR: { bg: "#23232b", fg: "#bfbfbf" },
    WALL: { bg: "#f5e3cd", fg: "black" },
    DOOR: { bg: "#583b30", fg: "black" },
    ROCK: { bg: "black", fg: "black" },
    LAKE: { bg: "#5e5eca", fg: "black" },
    SHALLOW_WATER: { bg: "#70a0ed", fg: "black" },
    GRASS: { bg: "#23232b", fg: "#8bc34a" },
    DEAD_GRASS: { bg: "#23232b", fg: "#8c542b" },
    DEAD_FOLIAGE: { bg: "#23232b", fg: "#8c542b" },
    FOLIAGE: { bg: "#23232b", fg: "#8bc34a" },
    RUBBLE: { bg: "#23232b", fg: "#bfbfbf" },
    TORCH_WALL: { bg: "red", fg: "yellow" },
    HAZE: { bg: "pink", fg: "pink", opacity: 0.4 },
    EMPTY: { bg: undefined, fg: undefined }
};

// cell types
export const CELLS = {
    [CELL_TYPES.DEBUG]: {
        type: "debug",
        letter: ","
    },
    [CELL_TYPES.EMPTY]: {
        type: "EMPTY",
        color: COLORS.EMPTY,
        letter: " ",
        priority: -1,
        flags: {}
    },
    [CELL_TYPES.FLOOR]: {
        type: "FLOOR",
        color: COLORS.FLOOR,
        letter: " ",
        priority: 9,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.WALL]: {
        type: "WALL",
        color: COLORS.WALL,
        letter: "#",
        priority: 18,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.ROCK]: {
        type: "ROCK",
        color: COLORS.ROCK,
        letter: "#",
        priority: 15,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.DOOR]: {
        type: "DOOR",
        color: COLORS.DOOR,
        letter: "+",
        priority: 16,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.EXIT_NORTH]: {
        type: "DOOR",
        color: COLORS.DOOR,
        letter: "^"
    },
    [CELL_TYPES.EXIT_EAST]: {
        type: "DOOR",
        color: COLORS.DOOR,
        letter: ">"
    },
    [CELL_TYPES.EXIT_SOUTH]: {
        type: "DOOR",
        color: COLORS.DOOR,
        letter: "V"
    },
    [CELL_TYPES.EXIT_WEST]: {
        type: "DOOR",
        color: COLORS.DOOR,
        letter: "<"
    },
    [CELL_TYPES.LAKE]: {
        type: "LAKE",
        color: COLORS.LAKE,
        letter: "~",
        priority: 20,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: false
        },
        // GLOWING WATER!!!!
        // glowLight: {
        //     // {1000, 1000, 1},		50,		false}
        //     minRadius: 1000,
        //     maxRadius: 1000,
        //     fade: 20,
        //     color: {
        //         baseColor: {
        //             // {75,	38, 15, 0, 15, 	7, 	0, true}
        //             r: 1,
        //             g: 1,
        //             b: 10
        //         },
        //         variance: {
        //             r: 1,
        //             g: 2,
        //             b: 0,
        //             overall: 0,
        //         }
        //     }
        // },
    },
    [CELL_TYPES.SHALLOW_WATER]: {
        type: "SHALLOW_WATER",
        color: COLORS.SHALLOW_WATER,
        letter: "~",
        priority: 17,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.GRANITE]: {
        type: "GRANITE",
        color: COLORS.GRANITE,
        letter: "g",
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.LUMINESCENT_FUNGUS]: {
        type: "luminescent_fungus",
        color: COLORS.LUMINESCENT_FUNGUS,
        letter: "f"
    },
    [CELL_TYPES.GRASS]: {
        type: "GRASS",
        color: COLORS.GRASS,
        letter: '"',
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.DEAD_GRASS]: {
        type: "DEAD_GRASS",
        color: COLORS.DEAD_GRASS,
        letter: '"',
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.DEAD_FOLIAGE]: {
        type: "DEAD_FOLIAGE",
        color: COLORS.DEAD_GRASS,
        letter: String.fromCharCode("0x03B3"),
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.FOLIAGE]: {
        type: "FOLIAGE",
        color: COLORS.GRASS,
        letter: String.fromCharCode("0x03B3"),
        priority: 10,
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.RUBBLE]: {
        type: "RUBBLE",
        color: COLORS.RUBBLE,
        letter: ",",
        priority: 11,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false
        }
    },
    [CELL_TYPES.TORCH_WALL]: {
        type: "TORCH_WALL",
        color: COLORS.TORCH_WALL,
        letter: "#",
        priority: 11,
        glowLight: {
            // {1000, 1000, 1},		50,		false}
            minRadius: 1000,
            maxRadius: 1000,
            fade: 20,
            color: {
                baseColor: {
                    // {75,	38, 15, 0, 15, 	7, 	0, true}
                    r: 75,
                    g: 38,
                    b: 15
                },
                variance: {
                    r: 0,
                    g: 15,
                    b: 7,
                    overall: 0,
                }
            }
        },
        flags: {
            OBSTRUCTS_PASSIBILITY: true,
            OBSTRUCTS_VISION: true
        }
    },
    [CELL_TYPES.HAZE]: {
        type: "HAZE",
        color: COLORS.HAZE,
        letter: " ",
        priority: 0,
        flags: {
            OBSTRUCTS_PASSIBILITY: false,
            OBSTRUCTS_VISION: false,
            YIELD_LETTER: true
        }
    },
    [CELL_TYPES.LIGHT_POOL]: {
        type: "LIGHT_POOL",
        color: COLORS.LIGHT_POOL,
        letter: " ",
        priority: 0,
        flags: {
            YIELD_LETTER: true
        },
        glowLight: {
            // {1000, 1000, 1},		50,		false}
            minRadius: 200,
            maxRadius: 200,
            fade: 10,
            color: {
                baseColor: {
                    // 100,	100,	75,		0,		0,			0,			0
                    r: 25,
                    g: 25,
                    b: 20
                },
                variance: {
                    r: 0,
                    g: 0,
                    b: 0,
                    overall: 0,
                }
            }
        },
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
    DF_FOLIAGE: 6,
    DF_TORCH_WALL: 7
};

export const DUNGEON_FEATURE_CATALOG = {
    [FEATURES.DF_GRANITE_COLUMN]: {
        tile: CELL_TYPES.GRANITE,
        start: 80,
        decr: 70,
        propagate: true
    },
    [FEATURES.DF_CRYSTAL_WALL]: {
        tile: CELL_TYPES.CRYSTAL_WALL,
        start: 200,
        decr: 50,
        propagate: true
    },
    [FEATURES.DF_LUMINESCENT_FUNGUS]: {
        tile: CELL_TYPES.DF_LUMINESCENT_FUNGUS,
        start: 60,
        decr: 8,
        propagate: true
    },
    [FEATURES.DF_GRASS]: {
        tile: CELL_TYPES.GRASS,
        start: 75,
        decr: 10,
        propagationTerrains: [CELL_TYPES.FLOOR, CELL_TYPES.DEAD_GRASS],
        subsequentFeature: FEATURES.DF_FOLIAGE,
        propagate: true
    },
    [FEATURES.DF_DEAD_GRASS]: {
        tile: CELL_TYPES.DEAD_GRASS,
        start: 75,
        decr: 10,
        propagationTerrains: [CELL_TYPES.FLOOR, CELL_TYPES.GRASS],
        subsequentFeature: FEATURES.DF_DEAD_FOLIAGE,
        propagate: true
    },
    [FEATURES.DF_DEAD_FOLIAGE]: {
        tile: CELL_TYPES.DEAD_FOLIAGE,
        start: 50,
        decr: 30,
        propagate: true,
        propagationTerrains: [
            CELL_TYPES.FLOOR,
            CELL_TYPES.DEAD_GRASS,
            CELL_TYPES.GRASS
        ]
    },
    [FEATURES.DF_FOLIAGE]: {
        tile: CELL_TYPES.FOLIAGE,
        start: 50,
        decr: 30,
        propagate: true,
        propagationTerrains: [
            CELL_TYPES.FLOOR,
            CELL_TYPES.DEAD_GRASS,
            CELL_TYPES.GRASS
        ]
    },
    [FEATURES.DF_RUBBLE]: {
        tile: CELL_TYPES.RUBBLE,
        start: 45,
        decr: 23,
        propagate: true
    },
    [FEATURES.DF_TORCH_WALL]: {
        tile: CELL_TYPES.TORCH_WALL,
        propagate: false
    },
    [FEATURES.DF_LIGHT_POOL]: {
        tile: CELL_TYPES.LIGHT_POOL,
        propagate: true,
        start: 66,
        decr: 20,
        propagationTerrains: Object.values(CELL_TYPES).filter(
            type => !(type === CELL_TYPES.WALL || type === CELL_TYPES.ROCK)
        )
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
        reqDungeon: [CELL_TYPES.FLOOR],
        reqLiquid: [],
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
        reqDungeon: [CELL_TYPES.FLOOR],
        reqLiquid: [],
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
        reqDungeon: [CELL_TYPES.FLOOR],
        reqLiquid: [],
        minDepth: 0,
        maxDepth: 9,
        frequency: 30,
        minIntercept: 0,
        minSlope: 0,
        maxNumber: 4
    },
    {
        terrain: 0,
        layer: 0,
        DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_TORCH_WALL],
        machine: 0,
        reqDungeon: [CELL_TYPES.WALL],
        reqLiquid: [],
        minDepth: 0,
        maxDepth: 9,
        frequency: 100,
        minIntercept: 100,
        minSlope: 70,
        maxNumber: 10
    },
    {
        terrain: 0,
        layer: 1,
        DF: DUNGEON_FEATURE_CATALOG[FEATURES.DF_LIGHT_POOL],
        machine: 0,
        reqDungeon: Object.values(CELL_TYPES).filter(
            type => !(type === CELL_TYPES.WALL || type === CELL_TYPES.ROCK)
        ),
        reqLiquid: Object.values(CELL_TYPES).filter(
            type => !(type === CELL_TYPES.WALL || type === CELL_TYPES.ROCK)
        ),
        minDepth: 0,
        // this doesnt do anything yet, make it a million, who cares
        maxDepth: 1000000,
        frequency: 70,
        minIntercept: 70,
        minSlope: 70,
        maxNumber: 2
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

export const RANDOM_COLORS = {
    [CELL_TYPES.TORCH_WALL]: {
        bg: {
            baseColor: {
                r: 210,
                g: 94,
                b: 73
            },
            noise: {
                r: 0,
                g: 30,
                b: 20,
                overall: 0
            },
            variance: {
                r: 1,
                g: 1,
                b: 1,
                overall: 0
            }
        },
        fg: {
            baseColor: {
                r: 251,
                g: 139,
                b: 40
            },
            noise: {
                r: 0,
                g: 15,
                b: 7,
                overall: 0
            },
            variance: {
                r: 1,
                g: 1,
                b: 1,
                overall: 0
            }
        }
    }
};
export const PERLIN_COLORS = {
    [CELL_TYPES.FLOOR]: {
        bg: {
            baseColor: {
                r: 35,
                g: 35,
                b: 43
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 4
            }
        },
        fg: {
            baseColor: {
                r: 191,
                g: 191,
                b: 191
            },
            variance: {
                r: 2,
                g: 2,
                b: 2,
                overall: 2
            }
        }
    },
    [CELL_TYPES.WALL]: {
        bg: {
            baseColor: {
                r: 119,
                g: 116,
                b: 99
            },
            variance: {
                r: 20,
                g: 0,
                b: 20,
                overall: 20
            }
        },
        fg: {
            baseColor: {
                r: 0,
                g: 0,
                b: 0
            },
            variance: {
                r: 20,
                g: 0,
                b: 20,
                overall: 20
            }
        }
    },
    [CELL_TYPES.LAKE]: {
        // 5,	10,		31,		5,		5,			5,			6
        bg: {
            baseColor: {
                r: 40,
                g: 40,
                b: 150
            },
            variance: {
                r: 5,
                g: 5,
                b: 5,
                overall: 15
            }
        },
        fg: {
            baseColor: {
                r: 80,
                g: 80,
                b: 180
            },
            variance: {
                r: 0,
                g: 0,
                b: 10,
                overall: 15
            }
        }
    },
    [CELL_TYPES.SHALLOW_WATER]: {
        // 20,20,		60,		0,		0,			10,			10,
        bg: {
            baseColor: {
                r: 80,
                g: 80,
                b: 180
            },
            variance: {
                r: 0,
                g: 0,
                b: 10,
                overall: 15
            }
        },
        fg: {
            baseColor: {
                r: 150,
                g: 150,
                b: 200
            },
            variance: {
                r: 0,
                g: 0,
                b: 10,
                overall: 30
            }
        }
    },
    [CELL_TYPES.GRASS]: {
        // 15,	40,		15,		15,		50,			15,			10
        fg: {
            baseColor: {
                r: 15,
                g: 40,
                b: 15
            },
            variance: {
                r: 30,
                g: 100,
                b: 60,
                overall: 30
            }
        },
        bg: {
            baseColor: {
                r: 35,
                g: 35,
                b: 43
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 0
            }
        }
    },
    [CELL_TYPES.FOLIAGE]: {
        // 15,	40,		15,		15,		50,			15,			10
        fg: {
            baseColor: {
                r: 15,
                g: 40,
                b: 15
            },
            variance: {
                r: 30,
                g: 100,
                b: 60,
                overall: 30
            }
        },
        bg: {
            baseColor: {
                r: 35,
                g: 35,
                b: 43
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 0
            }
        }
    },
    [CELL_TYPES.DEAD_GRASS]: {
        // 20,	13,		0,		20,		10,			5,			10
        fg: {
            baseColor: {
                r: 51,
                g: 33,
                b: 24
            },
            variance: {
                r: 50,
                g: 40,
                b: 10,
                overall: 25
            }
        },
        bg: {
            baseColor: {
                r: 35,
                g: 35,
                b: 43
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 0
            }
        }
    },
    [CELL_TYPES.DEAD_FOLIAGE]: {
        // 20,	13,		0,		20,		10,			5,			10
        fg: {
            baseColor: {
                r: 51,
                g: 33,
                b: 24
            },
            variance: {
                r: 20,
                g: 10,
                b: 5,
                overall: 20
            }
        },
        bg: {
            baseColor: {
                r: 35,
                g: 35,
                b: 43
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 0
            }
        }
    },
    [CELL_TYPES.LIGHT_POOL]: {
        fg: {
            baseColor: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 0
            }
        },
        bg: {
            baseColor: {
                r: 220,
                g: 220,
                b: 220,
                alpha: 0.2
            },
            variance: {
                r: 0,
                g: 0,
                b: 0,
                overall: 30
            }
        }
    }
};

export const PERLIN_PERIOD = 4;
