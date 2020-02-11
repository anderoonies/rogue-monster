import React, { Component, useState, useEffect } from "react";
import { Terminal } from "xterm";
import { connect } from "react-redux";
import { keyUp, keyDown, resize } from "./actions";

const chalk = require("chalk");
const c = new chalk.Instance({ enabled: true, level: 3 });
window.c = c;

class Renderer extends Component {
  constructor({ state, dispatch }) {
    super({ state, dispatch });
    this.state = {
      terminal: undefined,
      height: 0,
      width: 0
    };
  }

  componentDidMount() {
    const terminalElementRef = document.getElementById("terminal");
    const terminal = new Terminal({
      disableStdin: true,
      cursorWidth: 0,
      cursorStyle: "bar"
    });
    window.term = terminal;
    terminal.open(terminalElementRef);
    this.setState({
      terminal,
      width: terminal.cols,
      height: terminal.rows
    });

    function downHandler({ key }) {
      this.props.dispatch(keyDown(key));
    }

    const upHandler = ({ key }) => {
      this.props.dispatch(keyUp(key));
    };
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }

  componentDidUpdate(nextProps) {
    this.props.state.dungeon.forEach((row, rowIndex) => {
      row.forEach(cell => this.state.terminal.write(cell));
    });
  }

  render() {
    return [];
  }
}

export default connect(state => ({ state }))(Renderer);
