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
            items: {
                layer: 'layer-items',
                pseudos: ['group-items-pseudoLayer-z-0', 'group-items-pseudoLayer-z-10', 'group-items-pseudoLayer-z-20', 'group-items-pseudoLayer-z-30', 'group-items-pseudoLayer-z-40']
            },
            ui: {
                layer: 'layer-ui',
                pseudos: ['group-ui-pseudoLayer-main']
            }
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
            fill: '#EEEEFF',
            listening: true
        },
        grid: {
            name: 'group-world-grid',
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
            const node = canvasState.layers[id] || canvasState.groups[id] || canvasState.shapes[id];
            if (node) node.destroy();
            delete canvasState.layers[id];
            delete canvasState.groups[id];
            delete canvasState.shapes[id];
            delete canvasState.index[name];
        };

        function getNodeByName(name) {
            const nodeId = canvasState.index[name];
            if (!nodeId) return null;
    
            const stores = [canvasState.layers, canvasState.groups, canvasState.shapes];
    
            for (const store of stores) {
                if (store[nodeId]) {
                    return store[nodeId];
                }
            }
        return null;
        };

        const teardown = () => {
            try { canvasState.stage?.destroy(); } catch {}
            canvasState.stage = null;
            canvasState.layers = {};
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

        const makeGrid = () => {
            removeByName(config.grid.name);
            const halfPixel = 0.5,
                w = config.world.width,
                h = config.world.height,
                cx = w / 2,
                cy = h / 2,
                groupId = crypto.randomUUID();

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

            canvasState.groups[groupId] = new Konva.Group({ id: groupId, name, listening: false });
            canvasState.index[name] = groupId;

            const thePseudoLayer = getNodeByName('group-world-pseudoLayer-grid');
            if (!thePseudoLayer) throw new Error('[makeGrid] pseudo layer not found');
            thePseudoLayer.add(canvasState.groups[groupId]);
            
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
                if (xPlus <= w)  canvasState.groups[groupId].add(makePath([xPlus, 0, xPlus, h], isMajor));
                if (xMinus >= 0) canvasState.groups[groupId].add(makePath([xMinus, 0, xMinus, h], isMajor));

                const yPlus  = cy + step + halfPixel;
                const yMinus = cy - step - halfPixel;
                if (yPlus <= h)  canvasState.groups[groupId].add(makePath([0, yPlus, w, yPlus], isMajor));
                if (yMinus >= 0) canvasState.groups[groupId].add(makePath([0, yMinus, w, yMinus], isMajor));
              }
    
              canvasState.groups[groupId].add(makePath([cx + halfPixel, 0, cx + halfPixel, h], true));
              canvasState.groups[groupId].add(makePath([0, cy + halfPixel, w, cy + halfPixel], true));

              canvasState.groups[groupId].moveToTop();
        };
        
        const makeWorldRect = () => {
            const shapeId = crypto.randomUUID(),
                theLayer = getNodeByName('group-world-pseudoLayer-background');
            if (!theLayer) throw new Error('[makeWorldRect] pseudo layer not found');
            canvasState.shapes[shapeId] = new Konva.Rect({...config.world, id: shapeId});
            canvasState.index[config.world.name] = shapeId;
            canvasState.shapes[shapeId];
            theLayer.add(canvasState.shapes[shapeId]);
        };
        
        const makePseudoLayers = () => {
            let theLayer,
                newGroupId;
            Object.keys(config.pseudoLayers).forEach(key => {
                theLayer = getNodeByName(config.pseudoLayers[key].layer, 'layer');
                if (!theLayer) throw new Error('[makePseudoLayers] pseudo layer not found');
                config.pseudoLayers[key].pseudos.forEach(name => {
                    newGroupId = crypto.randomUUID();
                    canvasState.groups[newGroupId] = new Konva.Group({ id: newGroupId, name: name });
                    canvasState.index[name] = newGroupId;
                    theLayer.add(canvasState.groups[newGroupId]);
                });
            });
        };
        
        const makeLayers = () => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    layerName = `layer-${e}`;
                canvasState.layers[layerId] = new Konva.Layer({ id: layerId, name: layerName });
                canvasState.index[layerName] = layerId;
                canvasState.stage.add(canvasState.layers[layerId]);
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
  makeWorldRect();
  makeGrid();

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
