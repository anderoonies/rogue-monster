import React from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { createLogger } from "redux-logger";
import ReactDOM from "react-dom";
import "./index.css";
import "xterm/css/xterm.css";
import Renderer from "./Renderer";
import reducer, { initialState } from "./reducer";

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(createLogger())
);

ReactDOM.render(
  <Provider store={store}>
      <Renderer />
  </Provider>,
  document.getElementById("root")
);
