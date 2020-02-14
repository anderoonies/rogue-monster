import { CELL_WIDTH } from "./levels/levelCreator";

export const BRIGHT_THRESHOLD = 10;
export const DIM_THRESHOLD = 30;
export const DARK_THRESHOLD = 60;
export const DARKNESS_MAX = 100;

// http://www.roguebasin.com/index.php?title=FOV_using_recursive_shadowcasting
//              Shared
//             edge by
//  Shared     1 & 2      Shared
//  edge by\      |      /edge by
//  1 & 8   \     |     / 2 & 3
//           \1111|2222/
//           8\111|222/3
//           88\11|22/33
//           888\1|2/333
//  Shared   8888\|/3333  Shared
//  edge by-------@-------edge by
//  7 & 8    7777/|\4444  3 & 4
//           777/6|5\444
//           77/66|55\44
//           7/666|555\4
//           /6666|5555\
//  Shared  /     |     \ Shared
//  edge by/      |      \edge by
//  6 & 7      Shared     4 & 5
//             edge by
//             5 & 6
//

const octantTransforms = [
    { xx: 1, xy: 0, yx: 0, yy: 1 },
    { xx: 0, xy: 1, yx: 1, yy: 0 },
    { xx: 0, xy: -1, yx: 1, yy: 0 },
    { xx: -1, xy: 0, yx: 0, yy: 1 },
    { xx: -1, xy: 0, yx: 0, yy: -1 },
    { xx: 0, xy: -1, yx: -1, yy: 0 },
    { xx: 0, xy: 1, yx: -1, yy: 0 },
    { xx: 1, xy: 0, yx: 0, yy: -1 }
];

const getSlope = (x, y) => {
    return (this.state.player.x - x) / (this.state.player.y - y);
};

const cast = ({
    startColumn,
    leftViewSlope,
    rightViewSlope,
    transform,
    player,
    dungeon,
    light,
    memory,
    leftOffset,
    topOffset
}) => {
    let currentCol;
    let previousWasBlocked = false;
    let savedRightSlope = -1;
    const width = dungeon[0].length;
    const height = dungeon.length;
    for (let currentCol = startColumn; currentCol <= width; currentCol++) {
        let xc = currentCol;
        for (let yc = currentCol; yc >= 0; yc--) {
            let gridX = player.x + xc * transform.xx + yc * transform.xy;
            let gridY = player.y + xc * transform.yx + yc * transform.yy;

            if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) {
                continue;
            }

            // compute slopes to the corners of the current block, using to-left and bottom-right
            let leftBlockSlope = (yc + CELL_WIDTH / 2) / (xc - CELL_WIDTH / 2);
            let rightBlockSlope = (yc - CELL_WIDTH / 2) / (xc + CELL_WIDTH / 2);

            if (rightBlockSlope > leftViewSlope) {
                continue;
            } else if (leftBlockSlope < rightViewSlope) {
                break;
            }

            let distance = Math.min(DARKNESS_MAX, Math.max(xc * xc + yc * yc));
            light[gridY][gridX] = distance
            if (distance <= DARK_THRESHOLD) {
                debugger;
                try {
                    memory[gridY + topOffset][gridX + leftOffset] =
                        dungeon[gridY][gridX];
                } catch (e) {
                    debugger;
                }
            }

            let currentlyBlocked = dungeon[gridY][gridX].type !== "floor";
            if (previousWasBlocked) {
                if (currentlyBlocked) {
                    // keep traversing
                    savedRightSlope = rightBlockSlope;
                } else {
                    previousWasBlocked = false;
                    leftViewSlope = savedRightSlope;
                }
            } else {
                if (currentlyBlocked) {
                    if (leftBlockSlope <= leftViewSlope) {
                        cast({
                            startColumn: currentCol + 1,
                            leftViewSlope,
                            rightViewSlope: leftBlockSlope,
                            transform,
                            player,
                            dungeon,
                            light,
                            memory,
                            leftOffset,
                            topOffset
                        });
                    }

                    previousWasBlocked = true;
                    savedRightSlope = rightBlockSlope;
                }
            }
        }

        if (previousWasBlocked) {
            break;
        }
    }
};

export const scan = (player, dungeon, memory, leftOffset, topOffset) => {
    // we're viewing a FOV of the dungeon, but memory is everything, so we need to offset
    let updatedLight = new Array(dungeon.length)
        .fill(DARKNESS_MAX)
        .map(() => new Array(dungeon[0].length).fill(DARKNESS_MAX));
    updatedLight[player.y][player.x] = 0;
    let updatedMemory = [...memory];
    for (var octant = 0; octant < 8; octant++) {
        cast({
            startColumn: 1,
            leftViewSlope: 1.0,
            rightViewSlope: 0.0,
            transform: octantTransforms[octant],
            player,
            dungeon,
            light: updatedLight,
            memory: updatedMemory,
            leftOffset,
            topOffset
        });
    }
    console.log(updatedMemory);
    return { lightMap: updatedLight, updatedMemory };
};
