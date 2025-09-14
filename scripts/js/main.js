//import { board } from './board.js';
import { build } from './build.js';

const canvasState = {
  stage: null,
  layers: {},
  groups: {},
  shapes: {},
  index: {},
  resizeHandler: null,
};

const kCanvas = document.getElementById('konva-container');
const newBoard = build.setStageLayersGroups(kCanvas, canvasState);

console.log(canvasState.stage); // -> "Hello"
console.log(newBoard.cats);     // -> "cats"
