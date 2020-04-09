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
    click,
    debugShowCA
} from "./actions";
import { DEBUG_FLAGS, WIDTH, HEIGHT } from "./constants";

const Renderer = ({ state, dispatch }) => {
    useEffect(() => {
        if (!DEBUG_FLAGS.DEBUG) {
            dispatch(init());
        } else {
            if (DEBUG_FLAGS.SHOW_ACCRETION) {
                dispatch(debugAddRoom());
            } else if (DEBUG_FLAGS.ROOMS_ONLY) {
                dispatch(debugAddRoom());
            } else if (DEBUG_FLAGS.SHOW_CA) {
                dispatch(debugShowCA());
            } else {
                dispatch(accretionInit());
            }

            window.addEventListener("mousedown", e => {
                const dungeonRect = document
                    .querySelector("#lake-root #dungeon")
                    .getBoundingClientRect();
                const x = Math.floor((e.x - dungeonRect.left) / 16);
                const y = Math.floor((e.y - dungeonRect.top) / 18);
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
        }
    }, []);
    useEffect(() => {
        if (!DEBUG_FLAGS.DEBUG) {
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
    return !DEBUG_FLAGS.DEBUG ? (
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
                className="noselect"
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
                                    color: state.colorizedDungeon[rowIndex][colIndex],
                                    row: rowIndex,
                                    col: colIndex,
                                    debug: true
                                });
                            })}
                        </div>
                    );
                })}
            </div>
            <button
                className="step-button noselect"
                onClick={(e) => {
                    if (typeof state.debugStep === "function") {
                        e.preventDefault();
                        e.stopPropagation();
                        dispatch(state.debugStep());
                    }
                }}
            >
                Step
            </button>
        </div>
    );
};

export default connect(state => ({ state }))(Renderer);
