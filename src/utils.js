import { WIDTH, HEIGHT } from "./constants";

export const clamp = (x, min, max) => {
    return Math.min(max, Math.max(x, min));
};

export const boundX = value => {
    return clamp(value, 0, WIDTH);
};

export const boundY = value => {
    return clamp(value, 0, HEIGHT);
};

export const gridFromDimensions = (height, width, value) => {
    return new Array(height).fill(value).map(row => {
        return new Array(width).fill(value);
    });
};

export const coordinatesAreInMap = (row, col, dungeon) => {
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
