// this module implements procedural dungeon generation using the techniques in
// https://gamasutra.com/blogs/AAdonaac/20150903/252889/Procedural_Dungeon_Generation_Algorithm.php
// import {WIDTH, HEIGHT} from './constants'
// this is a circular import? ^
const Delaunator = require("delaunator").default;
const COLORS = require("../constants").COLORS;

const CELL_WIDTH = 1;
const WIDTH = 200;
const HEIGHT = 150;
const MAX_WIDTH = 10;
const MAX_HEIGHT = 10;
const MIN_WIDTH = 2;
const MIN_HEIGHT = 2;
const MAX_WIDTH_TO_HEIGHT = 2;
const MIN_WIDTH_TO_HEIGHT = 1 / 2;
const IMPORTANT_WIDTH = 4;
const IMPORTANT_HEIGHT = 4;
const FORCE_SCALE = 10;

const MAX_INT32 = 2147483647;
const MINSTD = 16807;

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

let Vector = function({ x, y }) {
    this.x = x;
    this.y = y;
};

Vector.prototype.add = function(v) {
    return new Vector({
        x: this.x + v.x,
        y: this.y + v.y
    });
};

Vector.prototype.subtract = function(v) {
    try {
        return new Vector({
            x: this.x - v.x,
            y: this.y - v.y
        });
    } catch (e) {
        debugger;
    }
};

Vector.prototype.length = function() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
};

Vector.prototype.div = function(v) {
    if (typeof v === "number") {
        return new Vector({ x: this.x / v, y: this.y / v });
    }
    return new Vector({ x: this.x / v.x, y: this.y / v.y });
};

Vector.prototype.scale = function(v) {
    return new Vector({ x: this.x * v, y: this.y * v });
};

const bound = ({ top, left, bottom, right }) => {
    return {
        top: snap(Math.min(top, HEIGHT)),
        left: snap(Math.max(0, left)),
        right: snap(Math.min(right, WIDTH)),
        bottom: snap(Math.max(0, bottom))
    };
};

const boundX = value => {
    return Math.max(0, Math.min(WIDTH - 1, value));
};

const boundY = value => {
    return Math.max(0, Math.min(HEIGHT - 1, value));
};

const snap = distance => {
    return distance > 0
        ? Math.round(distance + 0.5)
        : Math.round(distance - 0.5);
};

const between = (x, a, b) => {
    return x > a && x < b;
};

const middle = (a, b) => {
    return Math.round((a + b) / 2);
};

const cartesianToGrid = ({ x, y }) => {
    return {
        x: boundX(snap(x + Math.floor(WIDTH / 2))),
        y: boundY(snap(Math.floor(HEIGHT / 2) - y))
    };
};

const generateRooms = ({ radius, nRooms }) => {
    const randomPointInCircle = radius => {
        const angle = Math.random() * 2 * Math.PI;
        const pointRSquared = Math.random() * radius * radius;
        const pointX = Math.sqrt(pointRSquared) * Math.cos(angle);
        const pointY = Math.sqrt(pointRSquared) * Math.sin(angle);
        const center = {
            x: pointX,
            y: pointY
        };
        return cartesianToGrid(center);
    };

    const rooms = new Array(nRooms).fill(undefined).map((_, index) => {
        const center = randomPointInCircle(radius);
        const width = Math.floor(randn(MIN_WIDTH, 10, 2));
        const height = Math.floor(
            randn(MIN_WIDTH, width * MAX_WIDTH_TO_HEIGHT, 2)
        );
        let leftEdge = Math.round(center.x - width / 2);
        let rightEdge = Math.round(center.x + width / 2);
        let topEdge = Math.round(center.y - height / 2);
        let bottomEdge = Math.round(center.y + height / 2);

        // snap to edges properly
        if (bottomEdge >= HEIGHT) {
            bottomEdge = HEIGHT;
            topEdge = bottomEdge - height;
        }

        if (rightEdge >= WIDTH) {
            rightEdge = WIDTH;
            leftEdge = rightEdge - width;
        }

        if (leftEdge <= 0) {
            leftEdge = 0;
            rightEdge = leftEdge + width;
        }

        if (topEdge <= 0) {
            topEdge = 0;
            bottomEdge = topEdge + height;
        }

        const room = {
            index: index,
            top: boundY(topEdge),
            bottom: boundY(bottomEdge),
            left: boundX(leftEdge),
            right: boundX(rightEdge),
            center: center
        };

        return {
            ...room
        };
    });

    return rooms;
};

// returns an array of objects with shape
// { top: number, bottom: number, left: number, right: number }
const finalizeRooms = ({ radius, nRooms }) => {
    const rooms = generateRooms({ radius, nRooms });
    let [relaxedRooms, updated] = relaxRooms(rooms);
    let nRelaxations = 0;
    while (nRelaxations < 1000 && updated) {
        [relaxedRooms, updated] = relaxRooms(relaxedRooms);
        nRelaxations++;
    }
    return [relaxedRooms, makeHallways(relaxedRooms)];
};

const makeHallways = rooms => {
    const { edges, importantRooms } = triangulate(rooms);
    const spannedRooms = bfsPlusExtra(rooms, edges);
    const hallwayRooms = hallways(spannedRooms);
    return hallwayRooms;
};

const intersect = (roomA, roomB) => {
    return !(
        roomA.right < roomB.left ||
        roomA.left > roomB.right ||
        roomA.top > roomB.bottom ||
        roomA.bottom < roomB.top
    );
};

const relaxRooms = rooms => {
    // deep copy
    rooms = [...rooms];
    const roomBodies = [...rooms].map(room => {
        return {
            ...room,
            force: new Vector({ x: 0, y: 0 }),
            neighbors: 0
        };
    });

    let updated = false;

    for (let i = 0; i < roomBodies.length; i++) {
        const agent = roomBodies[i];
        for (let j = 0; j < roomBodies.length; j++) {
            if (i === j) {
                continue;
            }
            const neighbor = roomBodies[j];
            if (intersect(agent, neighbor)) {
                const separation = new Vector(agent.center).subtract(
                    neighbor.center
                );
                if (separation.x === 0)
                    separation.x = (1 - 2 * Math.random()) * 0.5;
                if (separation.y === 0)
                    separation.y = (1 - 2 * Math.random()) * 0.5;
                const agentWidth = agent.right - agent.left + 2;
                const agentHeight = agent.bottom - agent.top + 2;
                const xHeading = separation.x < 0 ? -1 : 1;
                const yHeading = separation.y < 0 ? -1 : 1;
                const pushForce = new Vector({
                    x:
                        xHeading < 0
                            ? separation.x - agentWidth
                            : separation.x + agentWidth,
                    y:
                        yHeading < 0
                            ? separation.y - agentHeight
                            : separation.y + agentHeight
                });
                const mass = agentWidth * agentHeight;
                const totalForce = agent.force.add(pushForce.div(mass / 2));
                agent.force = totalForce;
                updated = true;
                agent.neighbors++;
            }
        }
        if (
            agent.neighbors > 0 &&
            (agent.force.x === 0 || agent.force.y === 0)
        ) {
            agent.force = new Vector({
                x: 1 - FORCE_SCALE * Math.random(),
                y: 1 - FORCE_SCALE * Math.random()
            });
        }
        agent.force = agent.force.div(Math.max(1, agent.neighbors));
    }
    for (let i = 0; i < roomBodies.length; i++) {
        let room = rooms[i];
        let body = roomBodies[i];
        let force = { x: snap(body.force.x), y: snap(body.force.y) };

        rooms[i] = {
            ...room,
            center: {
                x: room.center.x + force.x,
                y: room.center.y + force.y
            },
            left: room.left + force.x,
            right: room.right + force.x,
            top: room.top + force.y,
            bottom: room.bottom + force.y
        };
    }
    return [rooms, updated];
};

const triangulate = rooms => {
    const importantRooms = rooms.filter(room => {
        const width = room.right - room.left;
        const height = room.bottom - room.top;
        return (
            width >= IMPORTANT_WIDTH &&
            height >= IMPORTANT_HEIGHT &&
            width / height > 0.5
        );
    });
    const centers = importantRooms.map(room => {
        return [room.center.x, room.center.y];
    });
    const centerToRoomIndex = importantRooms.reduce((acc, room) => {
        acc[`${room.center.x},${room.center.y}`] = room.index;
        return acc;
    }, {});
    const delaunay = Delaunator.from(centers);
    const triangles = delaunay.triangles;
    let coordinates = [];
    let edges = [];
    for (let i = 0; i < triangles.length; i += 3) {
        coordinates.push([
            centers[triangles[i]],
            centers[triangles[i + 1]],
            centers[triangles[i + 2]]
        ]);
        let center1 = centers[triangles[i]];
        let center2 = centers[triangles[i + 1]];
        let center3 = centers[triangles[i + 2]];
        let room1Index = centerToRoomIndex[`${center1[0]},${center1[1]}`];
        let room2Index = centerToRoomIndex[`${center2[0]},${center2[1]}`];
        let room3Index = centerToRoomIndex[`${center3[0]},${center3[1]}`];
        edges.push(
            [room1Index, room2Index],
            [room2Index, room3Index],
            [room3Index, room1Index]
        );
    }
    return { edges, importantRooms };
};

const bfsPlusExtra = (rooms, edges) => {
    // nodes = {
    //     roomIndex: {
    //         parents: [roomIndex],
    //         visited: boolean,
    //         neighbors: [room]
    //     }
    // }
    let nodes = rooms.reduce((acc, room, index) => {
        acc[room.index] = {
            parents: [],
            visited: false,
            neighbors: [],
            index: room.index
        };
        return acc;
    }, {});

    let roomLookup = rooms.reduce((acc, room) => {
        acc[room.index] = room;
        return acc;
    }, {});

    // edges =  {
    //     roomIndex: [room]
    // }
    nodes = edges.reduce((acc, [left, right]) => {
        acc[left].neighbors.push(nodes[right]);
        return acc;
    }, nodes);

    // 1  procedure BFS(G, start_v) is
    // 2      let Q be a queue
    // 3      label start_v as discovered
    // 4      Q.enqueue(start_v)
    // 5      while Q is not empty do
    // 6          v := Q.dequeue()
    // 7          if v is the goal then
    // 8              return v
    // 9          for all edges from v to w in G.adjacentEdges(v) do
    // 10             if w is not labeled as discovered then
    // 11                 label w as discovered
    // 12                 w.parent := v
    // 13                 Q.enqueue(w)
    let queue = [];
    let start = nodes[Object.keys(nodes)[0]];
    start.visited = true;
    queue.push(start);
    while (queue.length) {
        let v = queue.shift();
        let neighbors = v.neighbors;
        neighbors.forEach(neighbor => {
            if (!neighbor.visited) {
                neighbor.visited = true;
                neighbor.parents.push(v.index);
                queue.push(neighbor);
            }
        });
    }
    edges.forEach(([left, right]) => {
        if (Math.random() < 0.3) {
            nodes[left].parents.push(right);
        }
    });
    // annotate parents on the [rooms] array
    const annotatedRooms = rooms.map(room => {
        let parents = nodes[room.index].parents.map(idx => {
            return roomLookup[idx];
        });
        return { ...room, parents };
    });

    return annotatedRooms;
};

const hallways = rooms => {
    // im just a kid and this code is a nightmare
    let hallways = rooms.reduce((halls, room) => {
        const parents = room.parents;
        const roomHalls = parents.map(parent => {
            if (!parent) {
                return;
            }
            let hall;
            const [topRoom, bottomRoom] =
                room.bottom < parent.top ? [room, parent] : [parent, room];
            const [leftRoom, rightRoom] =
                room.right < parent.left ? [room, parent] : [parent, room];

            if (
                // (topRoom.right <= bottomRoom.right &&
                //     topRoom.right >= bottomRoom.left) ||
                // (topRoom.left >= bottomRoom.left && topRoom.left <= bottomRoom.right)
                between(topRoom.left, bottomRoom.left, bottomRoom.right - 1) ||
                between(topRoom.right, bottomRoom.left, bottomRoom.right - 1) ||
                between(bottomRoom.right, topRoom.left, topRoom.right - 1) ||
                between(bottomRoom.right, topRoom.left, topRoom.right - 1)
            ) {
                // |______|
                //    ______
                //   |      |
                //  or
                //   |______|
                // ______
                //|      |
                // vertical hallway 1
                const hallX = Math.min(
                    Math.max(rightRoom.left, leftRoom.left),
                    Math.min(rightRoom.right, leftRoom.right)
                );
                return {
                    bottom: boundY(bottomRoom.top - 1),
                    top: boundY(topRoom.bottom),
                    orientation: "vertical",
                    x: boundX(hallX),
                    debugName: `${bottomRoom.index}${topRoom.index}`
                };
            } else if (
                // (leftRoom.bottom <= rightRoom.bottom &&
                //     leftRoom.bottom >= rightRoom.top) ||
                // (leftRoom.top <= rightRoom.bottom && leftRoom.top >= rightRoom.top)
                between(leftRoom.top, rightRoom.bottom, rightRoom.top) ||
                between(leftRoom.bottom, rightRoom.bottom, rightRoom.top) ||
                between(rightRoom.bottom, leftRoom.bottom, leftRoom.top) ||
                between(rightRoom.top, leftRoom.bottom, leftRoom.top)
            ) {
                // _
                //  |  _
                //  | |
                // _| |
                //    |_
                //
                //  or
                //
                //     _
                //    |
                // _  |
                //  | |_
                //  |
                // _|
                const hallY = middle(topRoom.bottom, bottomRoom.top);
                return {
                    left: boundX(leftRoom.right + 1),
                    right: boundX(rightRoom.left - 1),
                    orientation: "horizontal",
                    y: boundY(hallY),
                    debugName: `${leftRoom.index}${rightRoom.index}`
                };
            } else {
                // elbow
                const [leftRoom, rightRoom] =
                    room.left < parent.left ? [room, parent] : [parent, room];
                const [topRoom, bottomRoom] =
                    room.bottom < parent.top ? [room, parent] : [parent, room];

                // RIGHT MAJOR
                // LT --
                //      |
                //      RB
                //  or
                //      RT
                //      |
                // LB --

                // UP MAJOR
                //  -- RT
                // |
                // LB
                //  or
                // LT
                //  |
                //   -- RB
                const major = leftRoom.center.x < WIDTH / 2 ? "right" : "up";
                const ascending = rightRoom.bottom < leftRoom.top;
                return {
                    orientation: "elbow",
                    major,
                    lx:
                        major === "right"
                            ? boundX(leftRoom.right - 1)
                            : boundX(leftRoom.center.x),
                    rx:
                        major === "right"
                            ? boundX(rightRoom.center.x)
                            : boundX(rightRoom.left - 1),
                    ry:
                        major === "right"
                            ? ascending
                                ? boundY(rightRoom.bottom - 1)
                                : boundY(rightRoom.top)
                            : boundY(rightRoom.center.y),
                    ly:
                        major === "right"
                            ? boundY(leftRoom.center.y)
                            : ascending
                            ? boundY(leftRoom.top - 1)
                            : boundY(leftRoom.bottom)
                };
            }
        });
        return halls.concat(roomHalls);
    }, []);
    return hallways.filter(hall => hall !== undefined);
};

const roomsToDungeon = (rooms, hallwayRooms, width, height) => {
    let dungeon = new Array(height).fill(undefined).map(row => {
        return new Array(width)
            .fill({
                type: "rock",
                letter: "#"
            })
            .map(rock => {
                return { ...rock, color: randColorFrom(COLORS.rock, 10) };
            });
    });
    const bound = (room, width, height) => {
        return {
            ...room,
            top: Math.max(0, room.top),
            bottom: Math.min(height, room.bottom),
            left: Math.max(0, room.left),
            right: Math.min(width, room.right),
            center: {
                x: Math.min(width, Math.max(0, room.center.x)),
                y: Math.min(height, Math.max(0, room.center.y))
            }
        };
    };
    rooms.forEach((room, i) => {
        room = bound(room, width, height);
        for (let row = room.top; row < room.bottom; row++) {
            for (let col = room.left; col < room.right; col++) {
                dungeon[row][col] = {
                    type: "floor",
                    letter: ",",
                    color: randColorFrom(COLORS.floor, 5),
                    debugLetter: i
                };
            }
        }
    });
    hallwayRooms.forEach((hallwayRoom, i) => {
        if (!hallwayRoom) {
            return;
        }
        switch (hallwayRoom.orientation) {
            case "vertical": {
                let { x, bottom, top } = hallwayRoom;
                for (let row = bottom; row >= top; row--) {
                    dungeon[row][x] = {
                        type: "floor",
                        letter: ",",
                        color: randColorFrom(COLORS.floor, 5),
                        debugLetter: "v"
                    };
                }
                break;
            }
            case "horizontal": {
                let { y, left, right } = hallwayRoom;
                for (let col = left; col <= right; col++) {
                    dungeon[y][col] = {
                        type: "floor",
                        letter: ",",
                        color: randColorFrom(COLORS.floor, 5),
                        debugLetter: "h"
                    };
                }
                break;
            }
            case "elbow": {
                let { major, lx, ly, ry, rx } = hallwayRoom;
                if (major === "right") {
                    for (let col = lx; col < rx; col++) {
                        dungeon[ly][col] = {
                            type: "floor",
                            letter: ",",
                            color: randColorFrom(COLORS.floor, 5),
                            debugLetter: "r"
                        };
                    }
                    const ascending = ry < ly;
                    if (ascending) {
                        for (let row = ly; row > ry; row--) {
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ",",
                                color: randColorFrom(COLORS.floor, 5),
                                debugLetter: "ra"
                            };
                        }
                    } else {
                        for (let row = ly; row < ry; row++) {
                            dungeon[row][rx] = {
                                type: "floor",
                                letter: ",",
                                color: randColorFrom(COLORS.floor, 5),
                                debugLetter: "rd"
                            };
                        }
                    }
                } else {
                    for (let col = rx; col > lx; col--) {
                        dungeon[ry][col] = {
                            type: "floor",
                            letter: ",",
                            color: randColorFrom(COLORS.floor, 5),
                            debugLetter: "u"
                        };
                    }
                    const ascending = ly < ry;
                    if (ascending) {
                        for (let row = ry; row >= ly; row--) {
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ",",
                                color: randColorFrom(COLORS.floor, 5),
                                debugLetter: "ua"
                            };
                        }
                    } else {
                        for (let row = ry; row <= ly; row++) {
                            dungeon[row][lx] = {
                                type: "floor",
                                letter: ",",
                                color: randColorFrom(COLORS.floor, 5),
                                debugLetter: "ud"
                            };
                        }
                    }
                }
                break;
            }
            default:
                break;
        }
    });
    return dungeon;
};

module.exports = {
    generateRooms,
    triangulate,
    boundX,
    boundY,
    finalizeRooms,
    relaxRooms,
    makeHallways,
    bfsPlusExtra,
    roomsToDungeon,
    hallways
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
