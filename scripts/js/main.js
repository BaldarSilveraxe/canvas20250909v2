//import { board } from './board.js';
import { build } from './build.js';

const canvasState = {
  stage: null,
  layers: {},
  groups: {},
  shapes: {},
  index: {},
  resizeHandler: null, // Store for cleanup
};

// Utility function
const getEl = (id) => document.getElementById(id);

const kCanvas = getEl('konva-container');

const newBoard = build.setStageLayersGroups(kCanvas, canvasState);
//const newBoard = board.create(kCanvas);
