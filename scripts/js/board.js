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
            '_rect-stage',
            '_group-world-grid'
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
        grid: {
            name: '_group-world-grid',
            colorMinor: '#FF0000',
            colorMajor: '#0000FF',
            strokeWidthMinor: 1,
            strokeWidthMajor: 2,
            minorLine: 67,
            majorLineEvery: 5
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

        const makeGrid = () => {
            const groupId = crypto.randomUUID(),
                groupName = config.grid.name,
                newGroup = new Konva.Group({ id: groupId, name: groupName }),
                worldRoot = getNodeByName('world-pseudo-layer'),
                center = { cx: config.world.width / 2, cy: config.world.height / 2};
            
            worldRoot.add(newGroup);
            
            for (let step = 0, i = 0; step <= center.cx; step += config.grid.minorLine, i++) {
                //const isMajor = ((config.grid.majorLineEvery > 1) && (i % (config.grid.minorLine * config.grid.majorLineEvery) === 0));
                const strokeColor = '#000000' // isMajor ? '#FFFFFF' : '#000000';
                const strokeWidth = 1 // isMajor ? 2 : 1;
                if (i !== 0) {
                    // Right of center
                    newGroup.add(new Konva.Line({
                        points: [center.cx + step, 0, center.cx, config.world.height],
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                    }));
                    // Left of center
                    newGroup.add(new Konva.Line({
                        points: [center.cx - step, 0, center.cx - step, config.world.height],
                        stroke: strokeColor,
                        strokeWidth: strokeWidth,
                    }));
                }
            }
            newGroup.moveToTop();
        };

        return {
            makeStage,
            makeLayers,
            makePseudoLayers,
            getNodeByName,
            makeWorldRect,
            makeGrid
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayers,
            makePseudoLayers,
            getNodeByName,
            makeWorldRect,
            makeGrid
        } = build();

        makeStage(kCanvas);
        makeLayers();
        makePseudoLayers();
        makeWorldRect();
makeGrid();

//test code~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const topRight = new Konva.Rect({ x: 3001, y: 0, width: 3000, height: 3000, fill: '#550055', listening: true });
const botLeft = new Konva.Rect({ x: 0, y: 3001, width: 3000, height: 3000, fill: '#555500', listening: true });
const botRight = new Konva.Rect({ x: 3001, y: 3001, width: 3000, height: 3000, fill: '#055550', listening: true });
const worldRoot = getNodeByName('world-pseudo-layer');
worldRoot.add(topRight);
worldRoot.add(botLeft);
worldRoot.add(botRight);
//test code~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        

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
