//import { board } from './board.js';
import { build } from './build.js';
import { CONFIG } from '.../configuration/canvasConfig.js';

const kCanvas = document.getElementById('konva-container');

const canvasState = {
  stage: null,
  layers: {},
  groups: {},
  shapes: {},
  index: {},
  resizeHandler: null,
};

const newBoard = build.setStageLayersGroups(kCanvas, canvasState, CONFIG);

console.log(canvasState.stage); // -> "Hello"
console.log(newBoard.cats);     // -> "cats"
