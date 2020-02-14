import React, { Component, useState, useEffect } from "react";
import "./App.css";
import Cell from "./Cell";
import { Terminal } from "xterm";
import { connect } from "react-redux";
import {
    keyUp,
    keyDown,
    resize,
    triangulate,
    init,
    moveLeft,
    moveRight,
    moveUp,
    moveDown
} from "./actions";

const Renderer = ({ state, dispatch }) => {
    useEffect(() => {
        dispatch(init());
    }, []);
    useEffect(() => {
        window.addEventListener("keydown", e => {
            // debugger;
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
            }
        });
    }, []);
    return state.fov.map((row, rowIndex) => {
        return state.settled ? (
            <div className="row">
                {row.map((cell, colIndex) => {
                    return Cell({ ...cell, row: rowIndex, col: colIndex });
                })}
            </div>
        ) : (
            <div>Making dungeon...</div>
        );
    });
};

export default connect(state => ({ state }))(Renderer);
