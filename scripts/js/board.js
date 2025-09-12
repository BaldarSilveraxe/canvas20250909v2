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
                group: 'group-world-pseudoLayer-camera-wrap',
                pseudos: ['group-world-pseudoLayer-background', 'group-world-pseudoLayer-grid']
            },
            items: {
                group: 'group-items-pseudoLayer-camera-wrap',
                pseudos: ['group-items-pseudoLayer-z-0', 'group-items-pseudoLayer-z-10', 'group-items-pseudoLayer-z-20', 'group-items-pseudoLayer-z-30', 'group-items-pseudoLayer-z-40']
            },
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
            minorLine: 70,
            majorLineEvery: 10
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
            try {
                canvasState.stage?.off();
                canvasState.stage?.destroy();
            } catch {}
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
        
const attachDragCamera = () => {
  const stage    = canvasState.stage;
  const camWorld = getNodeByName('group-world-pseudoLayer-camera-wrap');
  const camItems = getNodeByName('group-items-pseudoLayer-camera-wrap');
  if (!camWorld || !camItems) throw new Error('[camera] wrappers missing');

  // ensure only world camera is draggable
  camWorld.draggable(true);
  camItems.draggable(false);

  // keep items camera in lockstep
  const sync = () => {
    const p = camWorld.position();
    camItems.position(p);
    camWorld.getLayer()?.batchDraw();
    camItems.getLayer()?.batchDraw();
  };

  // clamp so you can’t fling the world off-screen (no zoom yet)
  const clamp = (pos) => {
    const vw = stage.width(), vh = stage.height();
    const W  = config.world.width, H = config.world.height;
    const minX = Math.min(0, vw - W), maxX = 0;
    const minY = Math.min(0, vh - H), maxY = 0;
    return { x: Math.max(minX, Math.min(pos.x, maxX)),
             y: Math.max(minY, Math.min(pos.y, maxY)) };
  };

  camWorld.dragBoundFunc(clamp);
  camWorld.on('dragmove',  sync);

  // nice UX: cursor + prevent text selection while dragging
  const c = stage.container();
  camWorld.on('mouseenter', () => (c.style.cursor = 'grab'));
  camWorld.on('mousedown',  () => { c.style.cursor = 'grabbing'; c.style.userSelect = 'none'; });
  camWorld.on('dragend',    () => { c.style.cursor = 'default';  c.style.userSelect = 'auto'; });

  // initial align (in case something pre-set positions)
  sync();

  // tiny API if you want to move programmatically
  return {
    setCamera: (x, y) => {
      const bounded = clamp({ x, y });
      camWorld.position(bounded);
      camItems.position(bounded);
      camWorld.getLayer()?.batchDraw();
      camItems.getLayer()?.batchDraw();
    },
    getCamera: () => ({ ...camWorld.position() })
  };
};

const makeGrid = () => {
    removeByName(config.grid.name);

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

    const w = config.world.width;
    const h = config.world.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxSteps = Math.ceil(Math.max(w, h) / 2 / minorLine);

    // Pre-split arrays to avoid per-frame filtering
    const minorV = [];
    const minorH = [];
    const majorV = [];
    const majorH = [];

    for (let i = 1; i <= maxSteps; i++) {
        const step = i * minorLine;
        const isMajor = (i % majorLineEvery === 0);

        // Vertical lines (no half-pixel baked in)
        const xPlus = cx + step;
        const xMinus = cx - step;

        if (xPlus <= w) {
            (isMajor ? majorV : minorV).push([xPlus, 0, xPlus, h]);
        }
        if (xMinus >= 0) {
            (isMajor ? majorV : minorV).push([xMinus, 0, xMinus, h]);
        }

        // Horizontal lines (no half-pixel baked in)
        const yPlus = cy + step;
        const yMinus = cy - step;

        if (yPlus <= h) {
            (isMajor ? majorH : minorH).push([0, yPlus, w, yPlus]);
        }
        if (yMinus >= 0) {
            (isMajor ? majorH : minorH).push([0, yMinus, w, yMinus]);
        }
    }

    // Add center lines to major arrays
    majorV.push([cx, 0, cx, h]);
    majorH.push([0, cy, w, cy]);

    const gridShape = new Konva.Shape({
        id: crypto.randomUUID(),
        name: name,
        listening: false,
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,

        sceneFunc: function(context, shape) {
            context.save();
            
            const scale = shape.getAbsoluteScale();
            
            // Scale-compensated line widths
            const lwMinorV = strokeWidthMinor / scale.x;
            const lwMinorH = strokeWidthMinor / scale.y;
            const lwMajorV = strokeWidthMajor / scale.x;
            const lwMajorH = strokeWidthMajor / scale.y;
            
            // Scale-compensated dash patterns
            const dashX = (dash) => (dash && dash.length) ? dash.map(d => d / scale.x) : [];
            const dashY = (dash) => (dash && dash.length) ? dash.map(d => d / scale.y) : [];
            
            // Scale-aware half-pixel alignment
            const alignX = 0.5 / scale.x;
            const alignY = 0.5 / scale.y;

            // Draw vertical minor lines
            if (minorV.length > 0) {
                context.save();
                context.translate(alignX, 0);
                context.strokeStyle = colorMinor;
                context.lineWidth = lwMinorV;
                context.setLineDash(dashX(dashMinor));
                context.beginPath();
                for (const [x1, y1, x2, y2] of minorV) {
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                }
                context.stroke();
                context.restore();
            }

            // Draw horizontal minor lines
            if (minorH.length > 0) {
                context.save();
                context.translate(0, alignY);
                context.strokeStyle = colorMinor;
                context.lineWidth = lwMinorH;
                context.setLineDash(dashY(dashMinor));
                context.beginPath();
                for (const [x1, y1, x2, y2] of minorH) {
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                }
                context.stroke();
                context.restore();
            }

            // Draw vertical major lines
            if (majorV.length > 0) {
                context.save();
                context.translate(alignX, 0);
                context.strokeStyle = colorMajor;
                context.lineWidth = lwMajorV;
                context.setLineDash(dashX(dashMajor));
                context.beginPath();
                for (const [x1, y1, x2, y2] of majorV) {
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                }
                context.stroke();
                context.restore();
            }

            // Draw horizontal major lines
            if (majorH.length > 0) {
                context.save();
                context.translate(0, alignY);
                context.strokeStyle = colorMajor;
                context.lineWidth = lwMajorH;
                context.setLineDash(dashY(dashMajor));
                context.beginPath();
                for (const [x1, y1, x2, y2] of majorH) {
                    context.moveTo(x1, y1);
                    context.lineTo(x2, y2);
                }
                context.stroke();
                context.restore();
            }

            context.restore();
        }
    });

    // Store in canvas state
    const shapeId = gridShape.id();
    canvasState.shapes[shapeId] = gridShape;
    canvasState.index[name] = shapeId;

    // Add to the grid pseudo layer
    const thePseudoLayer = getNodeByName('group-world-pseudoLayer-grid');
    if (!thePseudoLayer) {
        throw new Error('[makeGrid] pseudo layer not found');
    }
    thePseudoLayer.add(gridShape);

    return gridShape;
};

        const makeWorldRect = () => {
            const shapeId = crypto.randomUUID(),
                theLayer = getNodeByName('group-world-pseudoLayer-background');
            if (!theLayer) throw new Error('[makeWorldRect] pseudo layer not found');
            canvasState.shapes[shapeId] = new Konva.Rect({
                ...config.world,
                id: shapeId
            });
            canvasState.index[config.world.name] = shapeId;
            theLayer.add(canvasState.shapes[shapeId]);
        };

        const makePseudoLayers = () => {
            let targetGroup,
                newGroupId;
            Object.keys(config.pseudoLayers).forEach(key => {
                targetGroup = getNodeByName(config.pseudoLayers[key].group);
                if (!targetGroup) throw new Error('[makePseudoLayers] target group not found');
                config.pseudoLayers[key].pseudos.forEach(name => {
                    newGroupId = crypto.randomUUID();
                    canvasState.groups[newGroupId] = new Konva.Group({
                        id: newGroupId,
                        name: name
                    });
                    canvasState.index[name] = newGroupId;
                    targetGroup.add(canvasState.groups[newGroupId]);
                });
            });
        };

        const makeCameraWrappers = () => {
            let camWorldName = 'group-world-pseudoLayer-camera-wrap';
            let camItemsName = 'group-items-pseudoLayer-camera-wrap';
            let worldLayer = getNodeByName('layer-world');
            let itemsLayer = getNodeByName('layer-items');
            
            let camWorldNameId = crypto.randomUUID();
            canvasState.groups[camWorldNameId] = new Konva.Group({ id: camWorldNameId, name: camWorldName, draggable: true });
            canvasState.index[camWorldName] = camWorldNameId;
            worldLayer.add(canvasState.groups[camWorldNameId]);

            let camItemsNameId = crypto.randomUUID();
            canvasState.groups[camItemsNameId] = new Konva.Group({ id: camItemsNameId, name: camItemsName, draggable: false });
            canvasState.index[camItemsName] = camItemsNameId;
            itemsLayer.add(canvasState.groups[camItemsNameId]);
        };

        const makeLayers = () => {
            let listening;
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    layerName = `layer-${e}`;
                canvasState.layers[layerId] = new Konva.Layer({
                    id: layerId,
                    name: layerName,
                    listening: layerName === 'layer-ui' ? false : true
                });
                canvasState.index[layerName] = layerId;
                canvasState.stage.add(canvasState.layers[layerId]);
            });
        };

        const makeStage = (kCanvas) => {
            const kCanvasContainer = (typeof kCanvas === 'string') ? document.getElementById(kCanvas) : kCanvas;
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
            makeCameraWrappers,
            makePseudoLayers,
            makeWorldRect,
            makeGrid,
            attachDragCamera,
            removeByName,
            getNodeByName,
            teardown
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayers,
            makeCameraWrappers,
            makePseudoLayers,
            makeWorldRect,
            makeGrid,
            attachDragCamera,
            removeByName,
            getNodeByName,
            teardown
        } = build();

        try {
            makeStage(kCanvas); // may throw
            if (!(canvasState.stage instanceof Konva.Stage)) {
                throw new Error('board.create: stage not created');
            }
            makeLayers();
            makeCameraWrappers();
            makePseudoLayers();
            makeWorldRect();
            makeGrid();
            attachDragCamera();




            

            // One paint at the end:
            canvasState.stage.getLayers().forEach(l => l.batchDraw());
        } catch (err) {
            teardown();
            throw err; // surface the original error
        }

        console.log('finished');
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
