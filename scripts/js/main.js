//import { board } from './board.js';
import { board } from './build.js';

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

//const newBoard = board.create(kCanvas);
