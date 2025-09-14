//import { board } from './board.js';
import { setStageLayersGroups } from './build.js';

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

const newBoard = build.setStageLayersGroups(kCanvas);
//const newBoard = board.create(kCanvas);
