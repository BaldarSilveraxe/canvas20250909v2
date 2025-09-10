//import { board } from './board.js';

// Utility function
const getEl = (id) => document.getElementById(id);

const kCanvas = getEl('konva-container');

const newBoard = board.create(kCanvas);
