//import { board } from './board.js';
import { build } from './build.js';
import { CONFIG } from '../../configuration/canvasConfig.js';

const kCanvas = document.getElementById('konva-container');

const state = {
  stage: null,
  layers: {},
  groups: {},
  shapes: {},
  index: {},
  resizeHandler: null,
};

const api = build.setStageLayersGroups({
  htmlContainer: kCanvas,
  state,
  config: CONFIG,
});

console.log(state.stage); // -> "Hello"
console.log(build.setStageLayersGroups.cats);     // -> "cats"
