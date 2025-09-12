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
            fill: '#EEEEEE',
            listening: true
        },
        grid: {
            name: '_group-world-grid',
            colorMinor: '#96ADE9',
            colorMajor: '#647CA6',
            strokeWidthMinor: 1,
            strokeWidthMajor: 1,
            minorLine: 100,
            majorLineEvery: 3
        },
        zoom: {
            scaleMin: 0.10,
            scaleMax: 5.0
        },
    };

    const utility = () => {
        const removeByName = (name) => {
            const id = canvasState.index[name];
            if (!id) return;
            const node = canvasState.layers[id] || canvasState.pseudos[id] || canvasState.groups[id] || canvasState.shapes[id];
            if (node) node.destroy();
            delete canvasState.layers[id];
            delete canvasState.pseudos[id];
            delete canvasState.groups[id];
            delete canvasState.shapes[id];
            delete canvasState.index[name];
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

        return {
            removeByName,
            getNodeByName
        };
    };
    const build = () => {
        const {
            removeByName,
            getNodeByName
        } = utility();
        
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
            removeByName();
            const W = config.world.width,
            H = config.world.height,
            cx = W / 2,
            cy = H / 2,
            halfPixel = 0.5;

            const {
                name,
                minorLine,
                majorLineEvery,
                colorMinor,
                colorMajor,
                strokeWidthMinor,
                strokeWidthMajor
            } = config.grid;

            const group = new Konva.Group({
                id: crypto.randomUUID(),
                name,
                listening: false
            });

            const worldRoot = getNodeByName('world-pseudo-layer');

            const makePath = (points, isMajor) =>
            new Konva.Line({
                id: crypto.randomUUID(),
                name: 'grid-line',
                points,
                stroke: isMajor ? colorMajor : colorMinor,
                strokeWidth: isMajor ? strokeWidthMajor : strokeWidthMinor,
                listening: false
            });

            worldRoot.add(group);

            const maxSteps = Math.ceil(Math.max(W, H) / 2 / minorLine);

            for (let i = 1; i <= maxSteps; i++) {
                const step = i * minorLine;
                const isMajor = (i % majorLineEvery) === 0;

                const xPlus  = cx + step + halfPixel;
                const xMinus = cx - step - halfPixel;
                if (xPlus <= W)  group.add(makePath([xPlus, 0, xPlus, H], isMajor));
                if (xMinus >= 0) group.add(makePath([xMinus, 0, xMinus, H], isMajor));

                const yPlus  = cy + step + halfPixel;
                const yMinus = cy - step - halfPixel;
                if (yPlus <= H)  group.add(makePath([0, yPlus, W, yPlus], isMajor));
                if (yMinus >= 0) group.add(makePath([0, yMinus, W, yMinus], isMajor));
              }
    
              group.add(makePath([cx + halfPixel, 0, cx + halfPixel, H], true));
              group.add(makePath([0, cy + halfPixel, W, cy + halfPixel], true));

              group.moveToTop();
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

        const {
            removeByName,
            getNodeByName
        } = utility();

        makeStage(kCanvas);
        makeLayers();
        makePseudoLayers();
        makeWorldRect();
        makeGrid();

        canvasState.stage.draw();
        console.log('finished');

        console.log(getNodeByName('items-pseudo-layer'));
        
        //const newGroup = new Konva.Group({ id: `test`, name: `test` });
        //stage.child[0].child[0].add(newGroup); 
        const now = new Date();
        console.log(now);
        console.log(canvasState.stage);
        console.log(canvasState);
        
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
