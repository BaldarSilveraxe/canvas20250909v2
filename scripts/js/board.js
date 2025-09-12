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
            const halfPixel = 0.5;
            const maxSteps = Math.ceil(Math.max(w, h) / 2 / minorLine);

            // Pre-calculate all line positions
            const minorLines = [];
            const majorLines = [];

            for (let i = 1; i <= maxSteps; i++) {
                const step = i * minorLine;
                const isMajor = (i % majorLineEvery === 0);
                const lines = isMajor ? majorLines : minorLines;

                // Vertical lines
                const xPlus = cx + step + halfPixel;
                const xMinus = cx - step - halfPixel;

                if (xPlus <= w) lines.push(['vertical', xPlus, 0, xPlus, h]);
                if (xMinus >= 0) lines.push(['vertical', xMinus, 0, xMinus, h]);

                // Horizontal lines
                const yPlus = cy + step + halfPixel;
                const yMinus = cy - step - halfPixel;

                if (yPlus <= h) lines.push(['horizontal', 0, yPlus, w, yPlus]);
                if (yMinus >= 0) lines.push(['horizontal', 0, yMinus, w, yMinus]);
            }

            // Add center lines to major
            majorLines.push(['vertical', cx + halfPixel, 0, cx + halfPixel, h]);
            majorLines.push(['horizontal', 0, cy + halfPixel, w, cy + halfPixel]);

            const gridShape = new Konva.Shape({
                id: crypto.randomUUID(),
                name: name,
                listening: false,
                perfectDrawEnabled: false,
                shadowForStrokeEnabled: false,

sceneFunc: function(context, shape) {
    context.save();
    
    // Get current scale to compensate for zoom
    const scale = shape.getAbsoluteScale();
    
    // Compensate line widths for scaling
    const lwMinorV = strokeWidthMinor / scale.x;
    const lwMinorH = strokeWidthMinor / scale.y; 
    const lwMajorV = strokeWidthMajor / scale.x;
    const lwMajorH = strokeWidthMajor / scale.y;
    
    // Scale dash patterns
    const scaleDash = (dash, axisScale) =>
        (dash && dash.length) ? dash.map(d => d / axisScale) : [];
    
    // Draw minor lines
    if (minorLines.length > 0) {
        // Vertical minor lines
        const minorVerticals = minorLines.filter(line => line[0] === 'vertical');
        if (minorVerticals.length > 0) {
            context.strokeStyle = colorMinor;
            context.lineWidth = lwMinorV;
            context.setLineDash(scaleDash(dashMinor, scale.x));
            context.beginPath();
            minorVerticals.forEach(line => {
                context.moveTo(line[1], line[2]);
                context.lineTo(line[3], line[4]);
            });
            context.stroke();
        }
        
        // Horizontal minor lines
        const minorHorizontals = minorLines.filter(line => line[0] === 'horizontal');
        if (minorHorizontals.length > 0) {
            context.strokeStyle = colorMinor;
            context.lineWidth = lwMinorH;
            context.setLineDash(scaleDash(dashMinor, scale.y));
            context.beginPath();
            minorHorizontals.forEach(line => {
                context.moveTo(line[1], line[2]);
                context.lineTo(line[3], line[4]);
            });
            context.stroke();
        }
    }
    
    // Draw major lines (same pattern)
    if (majorLines.length > 0) {
        // Vertical major lines
        const majorVerticals = majorLines.filter(line => line[0] === 'vertical');
        if (majorVerticals.length > 0) {
            context.strokeStyle = colorMajor;
            context.lineWidth = lwMajorV;
            context.setLineDash(scaleDash(dashMajor, scale.x));
            context.beginPath();
            majorVerticals.forEach(line => {
                context.moveTo(line[1], line[2]);
                context.lineTo(line[3], line[4]);
            });
            context.stroke();
        }
        
        // Horizontal major lines
        const majorHorizontals = majorLines.filter(line => line[0] === 'horizontal');
        if (majorHorizontals.length > 0) {
            context.strokeStyle = colorMajor;
            context.lineWidth = lwMajorH;
            context.setLineDash(scaleDash(dashMajor, scale.y));
            context.beginPath();
            majorHorizontals.forEach(line => {
                context.moveTo(line[1], line[2]);
                context.lineTo(line[3], line[4]);
            });
            context.stroke();
        }
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
                throw new Error('[makeGridSuperOptimized] pseudo layer not found');
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
            let theLayer,
                newGroupId;
            Object.keys(config.pseudoLayers).forEach(key => {
                theLayer = getNodeByName(config.pseudoLayers[key].layer);
                if (!theLayer) throw new Error('[makePseudoLayers] pseudo layer not found');
                config.pseudoLayers[key].pseudos.forEach(name => {
                    newGroupId = crypto.randomUUID();
                    canvasState.groups[newGroupId] = new Konva.Group({
                        id: newGroupId,
                        name: name
                    });
                    canvasState.index[name] = newGroupId;
                    theLayer.add(canvasState.groups[newGroupId]);
                });
            });
        };

        const makeLayers = () => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    layerName = `layer-${e}`;
                canvasState.layers[layerId] = new Konva.Layer({
                    id: layerId,
                    name: layerName
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
            makePseudoLayers,
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

        try {
            makeStage(kCanvas); // may throw
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
            throw err; // surface the original error
        }

        console.log('finished');;
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
