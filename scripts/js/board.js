import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const canvasState = {
        stage: null,
        layers: {},
        pseudos: {},
        groups: {},
        shapes: {},
        index: {},
    };
    
    const config = {
        layers: ['world', 'items', 'ui'], // Used for creating layers and pseudo-layer 'layer-world' 'world-pseudo-layer' etc
        pseudoLayers: ['items-pseudo-layer-z-0', 'items-pseudo-layer-z-10', 'items-pseudo-layer-z-20', 'items-pseudo-layer-z-30', 'items-pseudo-layer-z-40'],
        RESERVED_NAMES: new Set([
            '_stage',
            'layer-world',
            'world-pseudo-layer',
            'layer-items',
            'items-pseudo-layer',
            'layer-ui',
            'ui-pseudo-layer',
            'items-pseudo-layer-z-0',
            'items-pseudo-layer-z-10',
            'items-pseudo-layer-z-20',
            'items-pseudo-layer-z-30',
            'items-pseudo-layer-z-40',
            '_rect-stage'
        ]),
        world: {
            x: 0,
            y: 0,
            name: '_rect-stage',
            width: 6000,
            height: 6000,
            fill: '#555555',
            listening: true
        },
        zoom: {
            scaleMin: 0.10,
            scaleMax: 5.0
        },
    };

    const build = () => {
        const makeStage = (cnvs) => {
            const kCanvasContainer = (typeof cnvs === 'string') ? document.getElementById(cnvs) : cnvs;
            if (!kCanvasContainer) {
                throw new Error('board.create: container not found');
            }
            const stageId = crypto.randomUUID();
            const stageName = "_stage";
            canvasState.stage = new Konva.Stage({
                id: stageId,
                name: stageName,
                container: kCanvasContainer,
                width: config.world.width,
                height: config.world.height,
            });
        };

        const makeLayers = (props = {}) => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    groupId = crypto.randomUUID(),
                    layerName = `layer-${e}`,
                    groupName = `${e}-pseudo-layer`,
                    newLayer = new Konva.Layer({ id: layerId, name: layerName }),
                    newGroup = new Konva.Group({ id: groupId, name: groupName });
                canvasState.layers[layerId] = newLayer;
                canvasState.pseudos[groupId] = newGroup;
                canvasState.index[layerName] = layerId;
                canvasState.index[groupName] = groupId;
                canvasState.stage.add(newLayer);
                newLayer.add(newGroup);
            });
        };

        function getNodeByName(name, type = true) {
            const nodeId = canvasState.index[name];
            if (!nodeId) {
                return null;
            }
            if (type === true) {
                // If type is not specified, search all stores
                if (canvasState.layers[nodeId]) return canvasState.layers[nodeId];
                if (canvasState.pseudos[nodeId]) return canvasState.pseudos[nodeId];
                if (canvasState.groups[nodeId]) return canvasState.groups[nodeId];
                if (canvasState.shapes[nodeId]) return canvasState.shapes[nodeId];
            } else {
                // If a specific type is requested, search only that store
                switch (type) {
                    case 'layer':
                        return canvasState.layers[nodeId] || null;
                    case 'pseudos':
                        return canvasState.pseudos[nodeId] || null;
                    case 'group':
                        return canvasState.groups[nodeId] || null;
                    case 'shape':
                        return canvasState.shapes[nodeId] || null;
                    default:
                        return null;
                }
            }
            return null; // Fallback return if nothing is found
        };
        
        const makePseudoLayers = (props = {}) => {
            for (let i = 0; i < 5; i++) {
                const groupId = crypto.randomUUID(),
                    groupName = `items-pseudo-layer-z-${(i * 10)}`,
                    newGroup = new Konva.Group({ id: groupId, name: groupName });
                let itemsGroup = null;
                canvasState.pseudos[groupId] = newGroup;
                canvasState.index[groupName] = groupId;
                itemsGroup = getNodeByName('items-pseudo-layer'); //, 'pseudo'
                if (itemsGroup) {
                    itemsGroup.add(newGroup);
                }
            }
        };

        const makeWorldRect = () => {
            const shapeId = crypto.randomUUID(),
                worldRect = new Konva.Rect({...config.world, id: shapeId}),
                worldRoot = getNodeByName('world-pseudo-layer');
            canvasState.shapes[shapeId] = worldRect;
            canvasState.index[config.world.name] = shapeId;     
            worldRoot.add(worldRect);
        };

        return {
            makeStage,
            makeLayers,
            makePseudoLayers,
            getNodeByName,
            makeWorldRect
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayers,
            makePseudoLayers,
            getNodeByName,
            makeWorldRect
        } = build();

        makeStage(kCanvas);
        makeLayers();
        makePseudoLayers();
        makeWorldRect();

//test code~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const topRight = new Konva.Rect({ x: 3001, y: 0, width: 3000, height: 3000, fill: '#550055', listening: true });
const botLeft = new Konva.Rect({ x: 0, y: 3001, width: 3000, height: 3000, fill: '#555500', listening: true });
const botRight = new Konva.Rect({ x: 3001, y: 3001, width: 3000, height: 3000, fill: '#055550', listening: true });
const worldRoot = getNodeByName('world-pseudo-layer');
worldRoot.add(topRight);
worldRoot.add(botLeft);
worldRoot.add(botRight);
//test code~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Add the zoom event listener
    const stage = canvasState.stage;
    const scaleBy = 1.05; // Adjust this value to change zoom speed

    stage.on('wheel', (e) => {
        // Only zoom if the Alt key is pressed
        if (!e.evt.altKey) {
            return;
        }
console.log('zooming');
        
        // Prevent default browser scrolling
        e.evt.preventDefault(); 

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        // Determine zoom direction and calculate new scale
        let newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        
        // Clamp the scale to the configured min and max
        const clampedScale = Math.max(config.zoom.scaleMin, Math.min(newScale, config.zoom.scaleMax));

        // Adjust the stage position to zoom at the cursor's location
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };
        stage.position(newPos);
        stage.scale({ x: clampedScale, y: clampedScale });
        stage.draw();
    });     
/*camstart~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const clamp = (value) => {
        return Math.max(value.min, Math.min(value.max, value.n));
    };
const smallestScaleToCover = () => {
            const { scaleMin, scaleMax } = config.zoom;
            const width = config.world.width, height = config.world.height;
            const minToCover = Math.max(canvasState.stage.width() / width, canvasState.stage.height() / height);
            return clamp({
                n: Math.min(1, minToCover),
                low: scaleMin,
                high: scaleMax
            });
        };
console.log(smallestScaleToCover());

//real code below~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/*
canvasState.stage.draw();
console.log('finished');

        
        console.log(getNodeByName('items-pseudo-layer'));
        
        //const newGroup = new Konva.Group({ id: `test`, name: `test` });
        //stage.child[0].child[0].add(newGroup); 
        const now = new Date();
        console.log(now);
        console.log(canvasState.stage);
        console.log(canvasState);

        
        // Removed: Don't destroy the stage immediately after creating it
        // stage.destroy(); 
        
        // Public API
        return {
            stage: canvasState.stage
            // You should return the stage and other useful objects here
            // so they can be used outside the module.
            // ... (rest of the public API)
        };
    };

    return {
        create
    };
})();

export {
    board
};
