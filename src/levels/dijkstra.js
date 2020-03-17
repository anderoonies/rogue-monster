// 1. mark all nodes as unvisited, create a set of unvisted nodes
// 2. assign every node a tentative distance. 0 for current, inf for others. mark initial as current
// 3. for current node, consider all unvisited neighbors and calc tentative distance. mark distance of all nodes to the min of previous or just-calculated
// 4. when all unvisited neighbors of current node visited, mark current node as visited and remove it from unvisited set.
// 5. if the destination node has been marked as visited, or the minimum tentative distance among nodes in the unvisited set is inf (unreachable), alg has finished
// 6. select the minimum tentative distance unvisited node.

const DIR_TO_TRANSFORM = require("../constants").DIR_TO_TRANSFORM;
const CELL_TYPES = require("../constants").CELL_TYPES;
const coordinatesAreInMap = require("../utils").coordinatesAreInMap;

const dungeonToNodeMap = ({ dungeon, inaccessible }) => {
    return dungeon.map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
            // 2. assign every node a tentative distance. 0 for current, inf for others. mark initial as current
            // debugger;
            return {
                x: colIndex,
                y: rowIndex,
                visited: false,
                distance: Infinity,
                accessible: !inaccessible(dungeon[rowIndex][colIndex]),
                parent: undefined
            };
        });
    });
};

const getNeighbors = ({ row, col, nodeMap }, revisit = false) => {
    let neighbors = [];
    let transform;
    let candidateNeighbor;
    for (let direction = 0; direction < 4; direction++) {
        transform = DIR_TO_TRANSFORM[direction];
        const y = row + transform.y;
        const x = col + transform.x;
        if (!coordinatesAreInMap(y, x)) {
            continue;
        }
        candidateNeighbor = nodeMap[y][x];
        if (
            candidateNeighbor.accessible &&
            (revisit || !candidateNeighbor.visited)
        ) {
            neighbors.push(candidateNeighbor);
        }
    }
    return neighbors;
};

export const propagateShortcut = ({ nodeMap, start }) => {
    // this algorithm doesnt work!
    let currentNode = nodeMap[start.y][start.x];
    currentNode.distance = 0;
    currentNode.visited = true;
    let neighbors;
    let distance;
    let unvisitedNodes = [currentNode];

    console.log(`propagating shortcut from ${start}`);
    debugger;
    while (unvisitedNodes.length) {
        currentNode = unvisitedNodes.pop();
        for (let neighbor of getNeighbors(
            { row: currentNode.y, col: currentNode.x, nodeMap },
            true
        )) {
            // 3. for current node, consider all unvisited neighbors and calc tentative distance. mark distance of all nodes to the min of previous or just-calculated
            distance = 1 + currentNode.distance;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                neighbor.parent = currentNode;
                console.log(`i reduced the distance to ${neighbor}!`);
                unvisitedNodes.push(neighbor);
            }
        }
    }
    return nodeMap;
};

export const pathDistance = ({
    start,
    end,
    dungeon,
    inaccessible,
    reuseNodeMap
}) => {
    // 1. mark all nodes as visited, create a set of unvisited nodes
    if (reuseNodeMap !== undefined) {
        return {
            distance:
                reuseNodeMap[end.y][end.x].distance -
                reuseNodeMap[start.y][start.x].distance,
            nodeMap: reuseNodeMap
        };
    }
    let nodeMap = dungeonToNodeMap({ dungeon, inaccessible });
    let currentNode = nodeMap[start.y][start.x];
    currentNode.distance = 0;
    currentNode.visited = true;
    let neighbors;
    let distance;
    let destinationNode = nodeMap[end.y][end.x];
    let candidateNextNode = destinationNode;
    let unvisitedNodes = nodeMap.flat().reduce((acc, node) => {
        if (node.accessible) {
            acc[`${node.y},${node.x}`] = node;
        }
        return acc;
    }, {});

    while (true) {
        neighbors = getNeighbors({
            row: currentNode.y,
            col: currentNode.x,
            nodeMap
        });
        for (let neighbor of neighbors) {
            // 3. for current node, consider all unvisited neighbors and calc tentative distance. mark distance of all nodes to the min of previous or just-calculated
            distance = 1 + currentNode.distance;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                neighbor.parent = currentNode;
            }
        }
        // 4. when all unvisited neighbors of current node visited, mark current node as visited and remove it from unvisited set.
        currentNode.visited = true;
        delete unvisitedNodes[`${currentNode.y},${currentNode.x}`];

        // 5. if the destination node has been marked as visited...
        if (currentNode === destinationNode) {
            return { distance: currentNode.distance, nodeMap };
        }
        candidateNextNode = Object.values(unvisitedNodes)
            .sort((a, b) => {
                if (a.distance < b.distance) {
                    return -1;
                } else if (b.distance < a.distance) {
                    return 1;
                }
                return 0;
            })
            .shift();
        // 5...or the minimum tentative distance among nodes in the unvisited set is inf (unreachable), alg has finished
        if (
            candidateNextNode === undefined ||
            candidateNextNode.distance === Infinity
        ) {
            return { distance: destinationNode.distance, nodeMap };
        }

        currentNode = candidateNextNode;
    }
};

export const traceShortestPath = (annotatedNodeMap, start, end) => {
    let currentNode = annotatedNodeMap[end.y][end.x];
    let startNode = annotatedNodeMap[start.y][start.x];
    let path = [currentNode];
    while (currentNode !== startNode) {
        currentNode = currentNode.parent;
        path.push(currentNode);
    }
    return path;
};
