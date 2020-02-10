import { KEY_DOWN, KEY_UP, RESIZE } from "./actions";
import Cell, { floorCell } from "./Cell";

console.log(floorCell);
const initialState = {
  dungeon: new Array(20).fill(floorCell).map(() => {return new Array(20).fill(floorCell)}),
  viewHeight: 20,
  viewWidth: 20
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case KEY_DOWN:
      console.log(action.keyCode);
      return state;
    case RESIZE:
      return {
        ...state,
        viewHeight: action.dimensions.height,
        viewWidth: action.dimensions.width,
        dungeon: new Array(action.dimensions.height)
          .fill(Cell(".", "#eee", "#ddd"))
          .map(() => {
            return new Array(action.dimensions.width).fill(
              Cell(".", "#eee", "#ddd")
            );
          })
      };
    default:
      return state;
  }
};

export default reducer;
