import React from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { createLogger } from "redux-logger";
import ReactDOM from "react-dom";
import "./index.css";
import "xterm/css/xterm.css";
import Renderer from "./Renderer";
import reducer, { initialState } from "./reducer";

const install = () => next => (reducer, initialModel, enhancer) => {
    let queue = [];

    const liftReducer = reducer => (state, action) => {
        const [model, cmd] = reducer(state, action);
        if (typeof cmd !== "undefined") {
            queue.push(cmd);
        }
        return model;
    };
    const store = next(liftReducer(reducer), initialModel, enhancer);

    const dispatch = function(action) {
        store.dispatch(action);
        if (queue.length) {
            const currentQueue = queue.flat(Infinity);
            queue = [];
            currentQueue.forEach(function(fn) {
                const result = fn();
                console.log(result);
                // https://stackoverflow.com/questions/27746304/how-do-i-tell-if-an-object-is-a-promise
                if (Promise.resolve(result) === result) {
                    result.then(action => {
                        if (action) {
                            dispatch(action);
                        }
                    });
                } else {
                    if (result) dispatch(result);
                }
            });
        }

        return Promise.resolve();
    };

    const replaceReducer = function(reducer) {
        return store.replaceReducer(liftReducer(reducer));
    };

    return {
        ...store,
        dispatch,
        replaceReducer
    };
};

const store = install()(createStore)(
    reducer,
    initialState,
    applyMiddleware(createLogger())
);

ReactDOM.render(
    <Provider store={store}>
        <Renderer />
    </Provider>,
    document.getElementById("flood-root")
);
