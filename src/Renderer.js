import React, { useEffect } from "react";
import "./App.css";
import Cell from "./Cell";
import { connect } from "react-redux";
import {
    init,
    debugInit,
    accretionInit,
    move
} from "./actions";
import { DEBUG } from "./constants";

const Renderer = ({ state, dispatch }) => {
    useEffect(() => {
        if (!DEBUG) {
            dispatch(init());
        } else {
            dispatch(accretionInit());
        }
    }, [!DEBUG ? state.settled : null]);
    useEffect(() => {
        if (!DEBUG) {
            window.addEventListener("keydown", e => {
                switch (e.code) {
                    case "ArrowRight":
                        dispatch(move({x:1, y:0}));
                        break;
                    case "ArrowLeft":
                        dispatch(move({x:-1, y:0}));
                        break;
                    case "ArrowUp":
                        dispatch(move({x:0, y:-1}));
                        break;
                    case "ArrowDown":
                        dispatch(move({x:0, y:1}));
                        break;
                    case "KeyD":
                        dispatch(move({x:1, y:0}));
                        break;
                    case "KeyA":
                        dispatch(move({x:-1, y:0}));
                        break;
                    case "KeyW":
                        dispatch(move({x:0, y:-1}));
                        break;
                    case "KeyS":
                        dispatch(move({x:0, y:1}));
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
                <div className="row">
                    {row.map((cell, colIndex) => {
                        return Cell({ ...cell, row: rowIndex, col: colIndex });
                    })}
                </div>
            );
        })
    ) : (
        <div>
            {state.debugMsg}
            {state.dungeon.map((row, rowIndex) => {
                return (
                    <div className="row">
                        {row.map((cell, colIndex) => {
                            return Cell({
                                ...cell,
                                row: rowIndex,
                                col: colIndex,
                                debug: true,
                                importantRooms: state.importantRooms
                            });
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default connect(state => ({ state }))(Renderer);
