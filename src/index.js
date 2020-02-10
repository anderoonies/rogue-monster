import React from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import ReactDOM from "react-dom";
import "./index.css";
import "xterm/css/xterm.css";
import Renderer from "./Renderer";
import reducer from "./reducer";

const store = createStore(reducer);

ReactDOM.render(
  <Provider store={store}>
    <Renderer />
  </Provider>,
  document.getElementById("root")
);
