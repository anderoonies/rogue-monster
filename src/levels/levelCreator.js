// this module implements procedural dungeon generation using the techniques in
// https://gamasutra.com/blogs/AAdonaac/20150903/252889/Procedural_Dungeon_Generation_Algorithm.php
const Delaunator = require("delaunator").default;

const CELL_WIDTH = 1;
const MAX_WIDTH = 20;
const MAX_HEIGHT = 25;
const MIN_WIDTH = 5;
const MIN_HEIGHT = 5;
const MAX_WIDTH_TO_HEIGHT = 2;
const MIN_WIDTH_TO_HEIGHT = 1 / 2;
const GRID_WIDTH = 100;
const GRID_HEIGHT = 100;
const RELAXATION_TIME = 10;
const JITTER = 1;
const FORCE_SCALE = 10;

const MAX_INT32 = 2147483647;
const MINSTD = 16807;

const randn = (min, max, skew) => {
    // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 5.0 + 0.5;
    // if (num > 1 || num < 0) num = randn(min, max, skew);
    num = Math.pow(num, skew);
    num *= max - min;
    num += min;
    return num;
};

const randr = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
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
    return new Vector({
        x: this.x - v.x,
        y: this.y - v.y
    });
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
        top: snap(Math.min(top, GRID_HEIGHT)),
        left: snap(Math.max(0, left)),
        right: snap(Math.min(right, GRID_WIDTH)),
        bottom: snap(Math.max(0, bottom))
    };
};

const boundX = value => {
    return Math.max(0, Math.min(GRID_WIDTH - 1, value));
};

const boundY = value => {
    return Math.max(0, Math.min(GRID_HEIGHT - 1, value));
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
        x: boundX(snap(x + Math.floor(GRID_WIDTH / 2))),
        y: boundY(snap(Math.floor(GRID_HEIGHT / 2) - y))
    };
};

// returns an array of objects with shape
// { top: number, bottom: number, left: number, right: number }
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
        const width = Math.round(randn(MIN_WIDTH, MAX_WIDTH, 2));
        const height = Math.round(
            Math.max(
                3,
                width * randn(MIN_WIDTH_TO_HEIGHT, MAX_WIDTH_TO_HEIGHT, 2)
            )
        );
        let leftEdge = Math.round(center.x - width / 2);
        let rightEdge = Math.round(center.x + width / 2);
        let topEdge = Math.round(center.y - height / 2);
        let bottomEdge = Math.round(center.y + height / 2);

        // snap to edges properly
        if (bottomEdge >= GRID_HEIGHT) {
            bottomEdge = GRID_HEIGHT;
            topEdge = bottomEdge - height;
        }

        if (rightEdge >= GRID_WIDTH) {
            rightEdge = GRID_WIDTH;
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
            center: center,
        };

        return {
            ...room
        };
    });

    let [relaxedRooms, updated] = relaxRooms(rooms);
    let nRelaxations = 0;
    while (nRelaxations < 1000 && updated) {
        [relaxedRooms, updated] = relaxRooms(relaxedRooms);
        nRelaxations++;
    }
    const edges = triangulate(relaxedRooms);
    const spannedRooms = bfs(relaxedRooms, edges);
    const hallwayRooms = hallways(spannedRooms);
    return [relaxedRooms, hallwayRooms];
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
    let collisions = roomBodies.reduce((acc, room, i) => {
        acc[i] = [];
        return acc;
    }, {});

    for (let i = 0; i < roomBodies.length; i++) {
        const agent = roomBodies[i];
        for (let j = 0; j < roomBodies.length; j++) {
            if (i === j) {
                continue;
            }
            const neighbor = roomBodies[j];
            if (intersect(agent, neighbor)) {
                if (
                    collisions[j].indexOf(i) > 0 ||
                    collisions[i].indexOf(j) > 0
                ) {
                    // alert(`${j} already hit ${i}!`);
                    continue;
                }
                collisions[j].push(i);
                collisions[i].push(j);
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
                const totalForce = agent.force.add(pushForce.div(FORCE_SCALE));
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
        // debugger;
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
    const centers = rooms.map(room => {
        return [room.center.x, room.center.y];
    });
    const centerToRoom = rooms.reduce((acc, room, index) => {
        acc[`${room.center.x},${room.center.y}`] = index;
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
        let room1 = centerToRoom[`${center1[0]},${center1[1]}`];
        let room2 = centerToRoom[`${center2[0]},${center2[1]}`];
        let room3 = centerToRoom[`${center3[0]},${center3[1]}`];
        edges.push([room1, room2], [room2, room3], [room3, room1]);
    }
    return edges;
};

const bfs = (rooms, edges) => {
    // nodes = {
    //     roomIndex: {
    //         parentIndex: null,
    //         visited: boolean,
    //         neighbors: [room]
    //     }
    // }
    let nodes = rooms.reduce((acc, room, index) => {
        acc[room.index] = {
            parentIndex: null,
            visited: false,
            neighbors: [],
            index
        };
        return acc;
    }, {});

    // edges =  {
    //     roomIndex: [room]
    // }
    // debugger;
    nodes = edges.reduce((acc, [left, right], i) => {
        // debugger;
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
    nodes[0].visited = true;
    queue.push(nodes[0]);
    while (queue.length) {
        let v = queue.shift();
        let neighbors = v.neighbors;
        neighbors.forEach(neighbor => {
            if (!neighbor.visited) {
                neighbor.visited = true;
                neighbor.parentIndex = v.index;
                queue.push(neighbor);
            }
        });
    }

    // annotate parents
    const annotatedRooms = rooms.map((room, roomIndex) => {
        return { ...room, parent: rooms[nodes[roomIndex].parentIndex] };
    });
    return annotatedRooms;
};

const hallways = rooms => {
    let hallways = rooms.map(room => {
        const parent = room.parent;
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

            // debugger;
            // vertical hallway 1
            const hallX = Math.min(
                Math.max(rightRoom.left, leftRoom.left),
                Math.min(rightRoom.right, leftRoom.right)
            );
            return {
                bottom: boundY(bottomRoom.top),
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
            // debugger;
            const hallY = middle(topRoom.bottom, bottomRoom.top);
            return {
                left: boundX(leftRoom.right),
                right: boundX(rightRoom.left),
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

            // LEFT MAJOR
            //  -- RT
            // |
            // LB
            //  or
            // LT
            //  |
            //   -- RB
            return {
                orientation: "elbow",
                major: Math.random() > 0.5 ? "right" : "left",
                lx: boundX(leftRoom.center.x),
                rx: boundX(rightRoom.center.x),
                ry: boundY(rightRoom.center.y),
                ly: boundY(leftRoom.center.y)
            };
        }
    });
    window.rooms = rooms;
    return hallways;
};

module.exports = {
    generateRooms,
    triangulate,
    boundX,
    boundY,
    CELL_WIDTH
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