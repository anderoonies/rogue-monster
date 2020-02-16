import React, { useEffect } from "react";
import "./App.css";
import Cell from "./Cell";
import { connect } from "react-redux";
import {
    init,
    debugInit,
    moveLeft,
    moveRight,
    moveUp,
    moveDown
} from "./actions";
import { DEBUG } from "./constants";

const Renderer = ({ state, dispatch }) => {
    useEffect(() => {
        if (!DEBUG) {
            dispatch(init());
        } else {
            dispatch(debugInit());
        }
    }, [!DEBUG ? state.settled : null]);
    useEffect(() => {
        if (!DEBUG) {
            window.addEventListener("keydown", e => {
                switch (e.code) {
                    case "ArrowRight":
                        dispatch(moveRight());
                        break;
                    case "ArrowLeft":
                        dispatch(moveLeft());
                        break;
                    case "ArrowUp":
                        dispatch(moveUp());
                        break;
                    case "ArrowDown":
                        dispatch(moveDown());
                        break;
                    case "KeyD":
                        dispatch(moveRight());
                        break;
                    case "KeyA":
                        dispatch(moveLeft());
                        break;
                    case "KeyW":
                        dispatch(moveUp());
                        break;
                    case "KeyS":
                        dispatch(moveDown());
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
