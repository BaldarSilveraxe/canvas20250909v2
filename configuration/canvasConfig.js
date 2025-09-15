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
            },
        },
        layers: {
            world: {
                layerName: 'layer-world',
                cameraName: 'group-world-pseudoLayer-camera-wrap'
            },
            items: {
                layerName: 'layer-items',
                cameraName: 'group-items-pseudoLayer-camera-wrap'
            },
            ui:{
                layerName: 'layer-ui',
                cameraName: null
            }
        },
        pseudoLayers: {
            world: {
                group: 'group-world-pseudoLayer-camera-wrap',
                pseudos: ['group-world-pseudoLayer-background', 'group-world-pseudoLayer-grid'],
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
        world: {
            x: 0,
            y: 0,
            name: 'shape-pseudoLayer-background-rect',
            width: 6000,
            height: 6000,
            fill: '#555555',
            listening: true,
        },
    },
};
