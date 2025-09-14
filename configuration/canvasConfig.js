// config.js
export const CONFIG = {
  build: {
    stage: {
      name: '_stage',
      elStyle: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        border: 0
      }
    },
    layers: ['world', 'items', 'ui'],
    pseudoLayers: {
      world: {
        group: 'group-world-pseudoLayer-camera-wrap',
        pseudos: [
          'group-world-pseudoLayer-background',
          'group-world-pseudoLayer-grid',
        ],
      },
      items: {
        group: 'group-items-pseudoLayer-camera-wrap',
        pseudos: [
          'group-items-pseudoLayer-z-0',
          'group-items-pseudoLayer-z-10',
          'group-items-pseudoLayer-z-20',
          'group-items-pseudoLayer-z-30',
          'group-items-pseudoLayer-z-40',
        ],
      },
    },
    cameraWraps: {
      worldCamera: 'group-world-pseudoLayer-camera-wrap',
      itemsCamera: 'group-items-pseudoLayer-camera-wrap',
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
      'group-world-grid',
    ]),
    world: {
      x: 0,
      y: 0,
      name: 'shape-pseudoLayer-background-rect',
      width: 6000,
      height: 6000,
      fill: '#000000',
      listening: true,
    },
  },
};
