const PERLIN_COLORS = require("./constants").PERLIN_COLORS;
const HEIGHT = require("./constants").HEIGHT;
const WIDTH = require("./constants").WIDTH;
const PERLIN_PERIOD = require("./constants").PERLIN_PERIOD;
const CELLS = require("./constants").CELLS;
const gridFromDimensions = require("./utils").gridFromDimensions;
const randomRange = require("./utils").randomRange;

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
    return {
        r,
        g,
        b
    };
};

const clampColor = c => {
    return Math.min(255, Math.max(0, c));
};

// returns cells with a bgColor and a fgColor
const colorizeDungeon = dungeon => {
    const noiseMaps = Object.keys(PERLIN_COLORS).reduce((acc, cellType) => {
        acc[cellType] = {
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

    const colorMap = dungeon.map((row, rowIndex) => {
        return row.map((cellType, colIndex) => {
            if (cellType in noiseMaps) {
                const componentNoiseMaps = noiseMaps[cellType];
                const colorRules = PERLIN_COLORS[cellType];
                debugger;
                const noiseComponents = {
                    r: componentNoiseMaps.r[rowIndex][colIndex],
                    g: componentNoiseMaps.g[rowIndex][colIndex],
                    b: componentNoiseMaps.b[rowIndex][colIndex]
                };
                return {
                    type: "rgb",
                    bg: colorizeCell({
                        baseColor: colorRules.baseColor,
                        noise: noiseComponents,
                        variance: colorRules.variance
                    }),
                    fg: CELLS[cellType].color
                };
            } else {
                return {
                    type: "hex",
                    ...CELLS[cellType].color
                };
            }
        });
    });
    return colorMap;
};

export default colorizeDungeon;
