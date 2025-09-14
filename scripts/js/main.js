//import { board } from './board.js';
import { build } from './build.js';
import { CONFIG } from '../../configuration/canvasConfig.js';

const kCanvas = document.getElementById('konva-container');

const state = {
  stage: null,
  indexId: {},
  indexName: {}
};

const api = build.setStageLayersGroups({
  htmlContainer: kCanvas,
  state,
  config: CONFIG,
});

console.log(state.stage); // -> "Hello"
console.log(api.cats);     // -> "cats"
