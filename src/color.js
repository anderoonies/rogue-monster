const PERLIN_COLORS = require("./constants").PERLIN_COLORS;
const RANDOM_COLORS = require("./constants").RANDOM_COLORS;
const HEIGHT = require("./constants").HEIGHT;
const WIDTH = require("./constants").WIDTH;
const PERLIN_PERIOD = require("./constants").PERLIN_PERIOD;
const CELLS = require("./constants").CELLS;
const gridFromDimensions = require("./utils").gridFromDimensions;
const randomRange = require("./utils").randomRange;
const Color = require("color");

const randomVector = () => {
    const x = (Math.random() < 0.5 ? -1 : 1) * Math.random();
    const y = (Math.random() < 0.5 ? -1 : 1) * Math.random();
    const length = Math.sqrt(x ** 2 + y ** 2);
    return {
        x: x / length,
        y: y / length
    };
};

const interpolate = (a, b, weight) => {
    const interpolatedValue = (1 - weight) * a + weight * b;
    const normalizedValue = (interpolatedValue + 1) / 2;
    return normalizedValue;
};

const dotGridGradient = ({
    gradientX,
    gradientY,
    pointX,
    pointY,
    gradientMap
}) => {
    const dx = pointX / PERLIN_PERIOD - gradientX;
    const dy = pointY / PERLIN_PERIOD - gradientY;
    let vector;
    try {
        vector = gradientMap[gradientY][gradientX];
    } catch (e) {
        debugger;
    }
    const dotProduct = dx * vector.x + dy * vector.y;
    return dotProduct;
};

const perlin = ({ x, y, gradientMap }) => {
    // assume period 4 for now
    const gradientX0 = Math.floor(x / PERLIN_PERIOD);
    const gradientX1 = gradientX0 + 1;
    const gradientY0 = Math.floor(y / PERLIN_PERIOD);
    const gradientY1 = gradientY0 + 1;

    // interpolation weights
    const sx = x / PERLIN_PERIOD - gradientX0;
    const sy = y / PERLIN_PERIOD - gradientY0;
    const v1 = dotGridGradient({
        gradientX: gradientX0,
        gradientY: gradientY0,
        pointX: x,
        pointY: y,
        gradientMap
    });
    const v2 = dotGridGradient({
        gradientX: gradientX1,
        gradientY: gradientY0,
        pointX: x,
        pointY: y,
        gradientMap
    });
    const interpolatedX0 = interpolate(v1, v2, sx);

    const v3 = dotGridGradient({
        gradientX: gradientX0,
        gradientY: gradientY1,
        pointX: x,
        pointY: y,
        gradientMap
    });
    const v4 = dotGridGradient({
        gradientX: gradientX1,
        gradientY: gradientY1,
        pointX: x,
        pointY: y,
        gradientMap
    });
    const interpolatedX1 = interpolate(v3, v4, sx);

    return interpolate(interpolatedX0, interpolatedX1, sy);
};

const generateNoiseMap = ({ height, width }) => {
    let gradientMap = Array.from(
        { length: Math.ceil(height / PERLIN_PERIOD) + 1 },
        () => {
            return Array.from(
                { length: Math.ceil(width / PERLIN_PERIOD) + 1 },
                () => {
                    return randomVector();
                }
            );
        }
    );
    return gridFromDimensions(HEIGHT, WIDTH, 0).map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
            return perlin({ y: rowIndex, x: colIndex, gradientMap });
        });
    });
};

const colorizeCell = ({ baseColor, noise, variance }) => {
    const shift = randomRange(0, variance.overall);
    const r = clampColor(
        Math.floor(baseColor.r + noise.r * variance.r + shift)
    );
    const g = clampColor(
        Math.floor(baseColor.g + noise.g * variance.g + shift)
    );
    const b = clampColor(
        Math.floor(baseColor.b + noise.b * variance.b + shift)
    );
    return Color({
        r,
        g,
        b,
        alpha: baseColor.alpha === undefined ? 1 : baseColor.alpha
    });
};

const colorizeCellTwoPointOh = ({ cell, noiseMaps, row, col }) => {
    let cellType = cell.constant;
    if (cell.constant in noiseMaps) {
        const fgComponentNoiseMaps = noiseMaps[cellType].fg;
        const bgComponentNoiseMaps = noiseMaps[cellType].bg;
        const fgColorRules = PERLIN_COLORS[cellType].fg;
        const bgColorRules = PERLIN_COLORS[cellType].bg;
        const fgNoiseComponents = {
            r: fgComponentNoiseMaps.r[row][col],
            g: fgComponentNoiseMaps.g[row][col],
            b: fgComponentNoiseMaps.b[row][col]
        };
        const bgNoiseComponents = {
            r: bgComponentNoiseMaps.r[row][col],
            g: bgComponentNoiseMaps.g[row][col],
            b: bgComponentNoiseMaps.b[row][col]
        };
        return {
            type: "rgb",
            bg: colorizeCell({
                baseColor: bgColorRules.baseColor,
                noise: bgNoiseComponents,
                variance: bgColorRules.variance
            }),
            fg: colorizeCell({
                baseColor: fgColorRules.baseColor,
                noise: fgNoiseComponents,
                variance: fgColorRules.variance
            })
        };
    } else if (cellType in RANDOM_COLORS) {
        const rule = RANDOM_COLORS[cellType];
        return {
            type: "rgb",
            bg: colorizeCell({
                baseColor: rule.bg.baseColor,
                noise: {
                    r: randomRange(0, rule.bg.noise.r),
                    g: randomRange(0, rule.bg.noise.g),
                    b: randomRange(0, rule.bg.noise.b)
                },
                variance: rule.bg.variance
            }),
            fg: colorizeCell({
                baseColor: rule.fg.baseColor,
                noise: {
                    r: randomRange(0, rule.fg.noise.r),
                    g: randomRange(0, rule.fg.noise.g),
                    b: randomRange(0, rule.fg.noise.b)
                },
                variance: rule.fg.variance
            })
        };
    } else {
        try {
            return {
                type: "hex",
                fg: Color(cell.color.fg),
                bg: Color(cell.color.bg)
            };
        } catch (e) {
            debugger;
        }
    }
};

const clampColor = c => {
    return Math.min(255, Math.max(0, c));
};

const makeNoiseMaps = () => {
    return Object.entries(PERLIN_COLORS).reduce((acc, [cellType, rules]) => {
        acc[cellType] = Object.keys(rules).reduce((acc, ruleCategory) => {
            acc[ruleCategory] = {
                r: generateNoiseMap({
                    height: HEIGHT,
                    width: WIDTH
                }),
                g: generateNoiseMap({
                    height: HEIGHT,
                    width: WIDTH
                }),
                b: generateNoiseMap({
                    height: HEIGHT,
                    width: WIDTH
                })
            };
            return acc;
        }, {});
        return acc;
    }, {});
};

// returns cells with a bgColor and a fgColor
const colorizeDungeon = dungeon => {
    const noiseMaps = makeNoiseMaps();

    const colorMap = dungeon.map((row, rowIndex) => {
        return row.map((cellType, colIndex) => {
            return colorizeCellTwoPointOh({
                cellType,
                noiseMaps,
                row: rowIndex,
                col: colIndex
            });
        });
    });
    return colorMap;
};

module.exports = {
    colorizeDungeon,
    colorizeCell: colorizeCellTwoPointOh,
    makeNoiseMaps
};
