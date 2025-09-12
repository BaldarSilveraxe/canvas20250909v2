import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const canvasState = {
        stage: null,
        layers: {},
        groups: {},
        shapes: {},
        index: {},
    };
    
    const config = {
        layers: ['world', 'items', 'ui'],
        pseudoLayers: {
            world: {
                layer: 'layer-world',
                pseudos: ['group-world-pseudoLayer-background', 'group-world-pseudoLayer-grid']
            },
            items: ['group-items-pseudoLayer-z-0', 'group-items-pseudoLayer-z-10', 'group-items-pseudoLayer-z-20', 'group-items-pseudoLayer-z-30', 'group-items-pseudoLayer-z-40'],
            ui: ['group-ui-main'],
        },
        RESERVED_NAMES: new Set([
            '_stage',
            'layer-world',
            'layer-items',
            'layer-ui',
            'group-world-pseudoLayer-background',
            'group-world-pseudoLayer-grid',
            'group-items-pseudoLayer-z-0',
            'group-items-pseudoLayer-z-10',
            'group-items-pseudoLayer-z-20',
            'group-items-pseudoLayer-z-30',
            'group-items-pseudoLayer-z-40',
            'group-ui-main',
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
            dashMinor: [4, 4],
            dashMajor: [],
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

        const teardown = () => {
            try { canvasState.stage?.destroy(); } catch {}
            canvasState.stage = null;
            canvasState.layers = {};
            canvasState.pseudos = {};
            canvasState.groups = {};
            canvasState.shapes = {};
            canvasState.index = {};
        };

        return {
            removeByName,
            getNodeByName,
            teardown
        };
    };

    const build = () => {
        const {
            removeByName,
            getNodeByName,
            teardown
        } = utility();


        const makeWorldRect = () => {
            const shapeId = crypto.randomUUID(),
                worldRect = new Konva.Rect({...config.world, id: shapeId}),
                worldRoot = getNodeByName('world-pseudo-layer');
            canvasState.shapes[shapeId] = worldRect;
            canvasState.index[config.world.name] = shapeId;     
            worldRoot.add(worldRect);
        };

        const makeGrid = () => {
            removeByName(config.grid.name);
            const halfPixel = 0.5,
                w = config.world.width,
                h = config.world.height,
                cx = w / 2,
                cy = h / 2;

            const {
                name,
                minorLine,
                majorLineEvery,
                colorMinor,
                colorMajor,
                strokeWidthMinor,
                strokeWidthMajor,
                dashMinor,
                dashMajor
            } = config.grid;

            const group = new Konva.Group({
                id: crypto.randomUUID(),
                name,
                listening: false
            });
            canvasState.groups[group._id] = group;
            canvasState.index[name] = group._id;

            const worldRoot = getNodeByName('world-pseudo-layer');
            worldRoot.add(group);
            
            const makePath = (points, isMajor) =>
            new Konva.Line({
                id: crypto.randomUUID(),
                name: 'grid-line',
                points,
                stroke: isMajor ? colorMajor : colorMinor,
                strokeWidth: isMajor ? strokeWidthMajor : strokeWidthMinor,
                dash: isMajor ? dashMajor : dashMinor,
                listening: false,
                perfectDrawEnabled: false,
                shadowForStrokeEnabled: false,
                // keep grid 1px in screen space when zooming:
                strokeScaleEnabled: false,
                transformsEnabled: 'position'
            });

            const maxSteps = Math.ceil(Math.max(w, h) / 2 / minorLine);

            for (let i = 1; i <= maxSteps; i++) {
                const step = i * minorLine;
                const isMajor = (i % majorLineEvery) === 0;

                const xPlus  = cx + step + halfPixel;
                const xMinus = cx - step - halfPixel;
                if (xPlus <= w)  group.add(makePath([xPlus, 0, xPlus, h], isMajor));
                if (xMinus >= 0) group.add(makePath([xMinus, 0, xMinus, h], isMajor));

                const yPlus  = cy + step + halfPixel;
                const yMinus = cy - step - halfPixel;
                if (yPlus <= h)  group.add(makePath([0, yPlus, w, yPlus], isMajor));
                if (yMinus >= 0) group.add(makePath([0, yMinus, w, yMinus], isMajor));
              }
    
              group.add(makePath([cx + halfPixel, 0, cx + halfPixel, h], true));
              group.add(makePath([0, cy + halfPixel, w, cy + halfPixel], true));

              group.moveToTop();
        };

        const makePseudoLayers = () => {
config.pseudoLayers.forEach((o) => {
    console.log(o);
});
            
            //for (var key1 in config.pseudoLayers) {
                //if (config.pseudoLayers.hasOwnProperty(key1)) {
                    //if (config.pseudoLayers[key1].hasOwnProperty(key2)) {
                        //console.log(config.pseudoLayers[key1])
                    //config.pseudoLayers[key].forEach((element, index) => {
                        //if ('world' === key) {
                            console.log(`Element at index ${index}: ${element}`);
                        //}    
                    //});
                    }
                }
            }
            /*
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
            */
        };
        
        const makeLayers = () => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    layerName = `layer-${e}`,
                    newLayer = new Konva.Layer({ id: layerId, name: layerName });
                canvasState.layers[layerId] = newLayer;
                canvasState.index[layerName] = layerId;
                canvasState.stage.add(newLayer);
            });
        };
        
        const makeStage = (cnvs) => {
            const kCanvasContainer = (typeof cnvs === 'string') ? document.getElementById(cnvs) : cnvs;
            if (!kCanvasContainer) {
                throw new Error('board.create: container not found');
            }
            canvasState.stage = new Konva.Stage({
                id: crypto.randomUUID(),
                name: '_stage',
                container: kCanvasContainer,
                width: config.world.width,
                height: config.world.height,
            });
        };

        return {
            makeStage,
            makeLayers,
            makePseudoLayers,
            getNodeByName,
            makeWorldRect,
            makeGrid,
            removeByName,
            getNodeByName,
            teardown
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayers,
            makePseudoLayers,
            makeWorldRect,
            makeGrid,
            removeByName,
            getNodeByName,
            teardown
        } = build();

        //makeStage(kCanvas);
        //makeLayers();
       // makePseudoLayers();
        //makeWorldRect();
        //makeGrid();

        //canvasState.stage.draw();
try {
  makeStage(kCanvas);                         // may throw
  if (!(canvasState.stage instanceof Konva.Stage)) {
    throw new Error('board.create: stage not created');
  }
  makeLayers();
  makePseudoLayers();
  //makeWorldRect();
  //makeGrid();

  // One paint at the end:
  canvasState.stage.getLayers().forEach(l => l.batchDraw());
} catch (err) {
  teardown();
  throw err;  // surface the original error
}
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
