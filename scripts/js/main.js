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

const config = {
    build: {
        layers: ['world', 'items', 'ui'],
        pseudoLayers: {
            world: {
                group: 'group-world-pseudoLayer-camera-wrap',
                pseudos: ['group-world-pseudoLayer-background', 'group-world-pseudoLayer-grid']
            },
            items: {
                group: 'group-items-pseudoLayer-camera-wrap',
                pseudos: ['group-items-pseudoLayer-z-0', 'group-items-pseudoLayer-z-10', 'group-items-pseudoLayer-z-20', 'group-items-pseudoLayer-z-30', 'group-items-pseudoLayer-z-40']
            },
        },
        cameraWraps: {
            worldCamera: 'group-world-pseudoLayer-camera-wrap', 
            itemsCamera: 'group-items-pseudoLayer-camera-wrap'
        },
        RESERVED_NAMES: new Set([
            '_stage',
            'layer-world',
            'layer-items',
            'layer-ui',
            'group-world-pseudoLayer-camera-wrap',
            'group-world-pseudoLayer-background',
            'group-world-pseudoLayer-grid',
            'group-items-pseudoLayer-camera-wrap',
            'group-items-pseudoLayer-z-0',
            'group-items-pseudoLayer-z-10',
            'group-items-pseudoLayer-z-20',
            'group-items-pseudoLayer-z-30',
            'group-items-pseudoLayer-z-40',
            'group-ui-pseudoLayer-main',
            'shape-pseudoLayer-background-rect',
            'group-world-grid'
        ]),
        world: {
            x: 0,
            y: 0,
            name: 'shape-pseudoLayer-background-rect',
            width: 6000,
            height: 6000,
            fill: '#000000',
            listening: true
        },
     }

};

const kCanvas = document.getElementById('konva-container');
const newBoard = build.setStageLayersGroups(kCanvas, canvasState);

console.log(canvasState.stage); // -> "Hello"
console.log(newBoard.cats);     // -> "cats"
