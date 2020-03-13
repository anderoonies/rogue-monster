import React, { useEffect } from "react";
import "./App.css";
import Cell from "./Cell";
import { connect } from "react-redux";
import {
    init,
    debugInit,
    accretionInit,
    move,
    debugAddRoom,
    click
} from "./actions";
import { DEBUG, DEBUG_SHOW_ACCRETION, WIDTH, HEIGHT } from "./constants";

const Renderer = ({ state, dispatch }) => {
    useEffect(() => {
        if (!DEBUG) {
            dispatch(init());
        } else {
            if (DEBUG_SHOW_ACCRETION) {
                window.addEventListener(
                    "keydown",
                    e => {
                        dispatch(debugAddRoom());
                    },
                    { once: true }
                );
            } else {
                dispatch(accretionInit());
            }

            window.addEventListener("mousedown", e => {
                const dungeonRect = document
                    .getElementById("dungeon")
                    .getBoundingClientRect();
                const x = Math.floor((e.x - dungeonRect.left) / 20);
                const y = Math.floor((e.y - dungeonRect.top) / 20);
                if (x < 0 || x > WIDTH || y < 0 || y > HEIGHT) {
                    return;
                }
                dispatch(
                    click({
                        x,
                        y,
                        which: e.which === 1 ? "left" : "right"
                    })
                );
            });
            window.addEventListener("keydown", e => {
                if (e.code === "Space") {
                    dispatch(accretionInit());
                }
            });
        }
    }, [!DEBUG ? state.settled : null]);
    useEffect(() => {
        if (!DEBUG) {
            window.addEventListener("keydown", e => {
                switch (e.code) {
                    case "ArrowRight":
                        dispatch(move({ x: 1, y: 0 }));
                        break;
                    case "ArrowLeft":
                        dispatch(move({ x: -1, y: 0 }));
                        break;
                    case "ArrowUp":
                        dispatch(move({ x: 0, y: -1 }));
                        break;
                    case "ArrowDown":
                        dispatch(move({ x: 0, y: 1 }));
                        break;
                    case "KeyD":
                        dispatch(move({ x: 1, y: 0 }));
                        break;
                    case "KeyA":
                        dispatch(move({ x: -1, y: 0 }));
                        break;
                    case "KeyW":
                        dispatch(move({ x: 0, y: -1 }));
                        break;
                    case "KeyS":
                        dispatch(move({ x: 0, y: 1 }));
                        break;
                    default:
                        break;
                }
            });
        }
    }, []);
    return !DEBUG ? (
        state.fov.map((row, rowIndex) => {
            return (
                <div className="row" key={`fov${rowIndex}`}>
                    {row.map((cell, colIndex) => {
                        return Cell({ ...cell, row: rowIndex, col: colIndex });
                    })}
                </div>
            );
        })
    ) : (
        <div>
            {state.debugMsg}
            <div
                id="dungeon"
                key="dungeon"
                onContextMenu={() => {
                    return false;
                }}
            >
                {state.displayDungeon.map((row, rowIndex) => {
                    return (
                        <div className="row" key={`dungeon${rowIndex}`}>
                            {row.map((cell, colIndex) => {
                                return Cell({
                                    ...cell,
                                    row: rowIndex,
                                    col: colIndex,
                                    debug: true
                                });
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default connect(state => ({ state }))(Renderer);
