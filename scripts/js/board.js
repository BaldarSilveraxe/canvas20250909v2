import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const canvasState = {
        stage: null,
        layers: {},
        groups: {},
        shapes: {},
        index: {},
        resizeHandler: null, // Store for cleanup
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
                // Clean up resize handler
                if (canvasState.resizeHandler) {
                    window.removeEventListener('resize', canvasState.resizeHandler);
                    canvasState.resizeHandler = null;
                }
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

        const makeUi = () => {
            const uiLayer = getNodeByName('layer-ui');
            if (!uiLayer) throw new Error('[makeUi] layer-ui not found');

            const groupId = crypto.randomUUID();
            const uiGroup = new Konva.Group({
                id: groupId,
                name: 'group-ui-pseudoLayer-main',
                draggable: true
            });
            canvasState.groups[groupId] = uiGroup;
            canvasState.index['group-ui-pseudoLayer-main'] = groupId;

            uiLayer.add(uiGroup);

            //Test stuff
            const complexText = new Konva.Text({
                x: 150,
                y: 100,
                width: 150,
                height: 100,
                padding: 5,
                align: 'center',
                fontSize: 10,
                fill: '#000000',
                text: "This is a simple text frame example.\n\n" +
                    "Its within the UI layer and doesn't move with the camera."
            });
            const greyBox = new Konva.Rect({
                x: 150,
                y: 100,
                width: 150,
                height: 100,
                fill: 'gray'
            });


            const textGroup = new Konva.Group({
                draggable: true
            });
            textGroup.add(greyBox, complexText);


            uiGroup.add(textGroup);
        };

        const attachDragCamera = () => {
            const stage    = canvasState.stage;
            const camWorld = getNodeByName('group-world-pseudoLayer-camera-wrap');
            const camItems = getNodeByName('group-items-pseudoLayer-camera-wrap');
            if (!camWorld || !camItems) throw new Error('[camera] wrappers missing');

            // --- Cached calculations helper -------------------------------------------
            const getViewportSize = () => {
                const c = stage.container();
                return {
                    vw: c.clientWidth  || stage.width(),
                    vh: c.clientHeight || stage.height(),
                };
            };

            const getScaleConstraints = () => {
                const { vw, vh } = getViewportSize();
                const worldMinSide = Math.min(config.world.width, config.world.height);
                return {
                    min: Math.max(config.zoom.scaleMin, Math.min(vw, vh) / worldMinSide),
                    max: config.zoom.scaleMax
                };
            };

            const sync = () => {
                const p = camWorld.position();
                camItems.position(p);
                camWorld.getLayer()?.batchDraw();
                camItems.getLayer()?.batchDraw();
            };

            // Clamp that works for both pan & zoom (axis-aware, absolute scale, integer bounds)
            const clamp = (pos) => {
                const { vw, vh } = getViewportSize();

                // use absolute scale in case a parent (layer) gets transformed in future
                const abs = camWorld.getAbsoluteScale();
                const sx = abs.x || 1;
                const sy = abs.y || 1;

                const W = Math.round(config.world.width  * sx);
                const H = Math.round(config.world.height * sy);

                // integer clamp avoids subpixel drift leaving 1px gutters
                const clampAxis = (val, view, content) => {
                    if (content <= view) {
                        // locked center when content smaller than viewport on that axis
                        return Math.round((view - content) / 2);
                    }
                    const min = Math.floor(view - content); // most negative allowed
                    const max = 0;                          // most positive allowed
                    const v   = Math.round(val);
                    return Math.max(min, Math.min(v, max));
                };

                return { x: clampAxis(pos.x, vw, W), y: clampAxis(pos.y, vh, H) };
            };

            // --- PAN -------------------------------------------------------------------
            camWorld.draggable(true);
            camItems.draggable(false);
            camWorld.dragBoundFunc(clamp);
            camWorld.on('dragmove', sync);

            // --- UX niceties -----------------------------------------------------------
            const c = stage.container();
            const setCursor = (v) => { c.style.cursor = v; };
            const setSelect = (v) => { c.style.userSelect = v; };
            camWorld.on('mouseenter', () => setCursor('grab'));
            camWorld.on('mouseleave', () => setCursor('default'));
            camWorld.on('dragstart',  () => { setCursor('grabbing'); setSelect('none'); });
            const endDrag = () => { setCursor('default'); setSelect('auto'); };
            camWorld.on('dragend', endDrag);
            
            const endDragHandler = endDrag;
            stage.on('contentMouseup', endDragHandler);
            stage.on('contentTouchend', endDragHandler);
            stage.on('contentMouseout', endDragHandler);

            // --- ZOOM (Alt/Option + wheel), with dynamic min-scale ---------------------
            stage.on('wheel', (e) => {
                if (!e.evt.altKey) return;           // only when Alt is held
                e.evt.preventDefault();              // stop page scroll

                const oldScale = camWorld.scaleX() || 1;
                const scaleBy  = 1.1;
                const dir      = e.evt.deltaY > 0 ? 1 : -1;
                let newScale   = dir > 0 ? oldScale / scaleBy : oldScale * scaleBy;

                // clamp zoom to dynamic min (and configured max) using cached constraints
                const { min: minScale, max: maxScale } = getScaleConstraints();
                newScale = Math.max(minScale, Math.min(maxScale, newScale));
                if (newScale === oldScale) return;

                const pointer = stage.getPointerPosition();
                if (!pointer) return;

                // anchor zoom at pointer
                const mousePointTo = {
                    x: (pointer.x - camWorld.x()) / oldScale,
                    y: (pointer.y - camWorld.y()) / oldScale
                };
                const newPos = {
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale
                };

                camWorld.scale({ x: newScale, y: newScale });
                camItems.scale({ x: newScale, y: newScale });

                const bounded = clamp(newPos);
                camWorld.position(bounded);
                camItems.position(bounded);

                camWorld.getLayer()?.batchDraw();
                camItems.getLayer()?.batchDraw();
            });

            // --- Initial snap: enforce min scale & bounds ------------------------------
            {
                const s = camWorld.scaleX() || 1;
                const { min: minScale } = getScaleConstraints();
                if (s < minScale) {
                    camWorld.scale({ x: minScale, y: minScale });
                    camItems.scale({ x: minScale, y: minScale });
                }
                const p0 = clamp(camWorld.position());
                camWorld.position(p0);
                camItems.position(p0);
                camWorld.getLayer()?.batchDraw();
                camItems.getLayer()?.batchDraw();
            }

            // initial align
            sync();

            // tiny API
            return {
                setCamera: (x, y) => {
                    const bounded = clamp({ x, y });
                    camWorld.position(bounded);
                    camItems.position(bounded);
                    camWorld.getLayer()?.batchDraw();
                    camItems.getLayer()?.batchDraw();
                },
                getCamera: () => ({ ...camWorld.position() }),
                getScaleConstraints, // Expose for external use
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
            canvasState.groups[camWorldNameId] = new Konva.Group({
                id: camWorldNameId,
                name: camWorldName,
                draggable: true
            });
            canvasState.index[camWorldName] = camWorldNameId;
            worldLayer.add(canvasState.groups[camWorldNameId]);

            let camItemsNameId = crypto.randomUUID();
            canvasState.groups[camItemsNameId] = new Konva.Group({
                id: camItemsNameId,
                name: camItemsName,
                draggable: false
            });
            canvasState.index[camItemsName] = camItemsNameId;
            itemsLayer.add(canvasState.groups[camItemsNameId]);
        };

        const makeLayers = () => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID(),
                    layerName = `layer-${e}`;
                canvasState.layers[layerId] = new Konva.Layer({
                    id: layerId,
                    name: layerName,
                    listening: true
                });
                canvasState.index[layerName] = layerId;
                canvasState.stage.add(canvasState.layers[layerId]);
            });
        };

        const makeStage = (kCanvas) => {
            const container = (typeof kCanvas === 'string') ? document.getElementById(kCanvas) : kCanvas;
            if (!container) throw new Error('board.create: container not found');

            // Ensure the container is viewport-sized and doesn't scroll
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.overflow = 'hidden';
            container.style.padding = '0';
            container.style.margin  = '0';
            container.style.border  = '0';

            const w = container.clientWidth;
            const h = container.clientHeight;

            canvasState.stage = new Konva.Stage({
                id: crypto.randomUUID(),
                name: '_stage',
                container,
                width: w, // <— viewport width
                height: h, // <— viewport height
            });

            // Debounced resize handler with cached calculations
            let resizeTimeout;
            const onResize = () => {
                const nw = container.clientWidth;
                const nh = container.clientHeight;
                canvasState.stage.size({ width: nw, height: nh });

                const camWorld = getNodeByName('group-world-pseudoLayer-camera-wrap');
                const camItems = getNodeByName('group-items-pseudoLayer-camera-wrap');
                if (!camWorld || !camItems) return;

                // Use cached scale constraint calculation
                const worldMinSide = Math.min(config.world.width, config.world.height);
                const minScale = Math.max(config.zoom.scaleMin, Math.min(nw, nh) / worldMinSide);

                const s = camWorld.scaleX() || 1;
                if (s < minScale) {
                    camWorld.scale({ x: minScale, y: minScale });
                    camItems.scale({ x: minScale, y: minScale });
                }

                // re-clamp the current position (shared clamping logic)
                const abs = camWorld.getAbsoluteScale();
                const sx  = abs.x || 1;
                const sy  = abs.y || 1;
                const W   = Math.round(config.world.width  * sx);
                const H   = Math.round(config.world.height * sy);

                const clampAxis = (val, view, content) => {
                    if (content <= view) return Math.round((view - content) / 2);
                    const min = Math.floor(view - content);
                    const max = 0;
                    const v   = Math.round(val);
                    return Math.max(min, Math.min(v, max));
                };

                const bounded = {
                    x: clampAxis(camWorld.x(), nw, W),
                    y: clampAxis(camWorld.y(), nh, H),
                };
                camWorld.position(bounded);
                camItems.position(bounded);

                camWorld.getLayer()?.batchDraw();
                camItems.getLayer()?.batchDraw();
            };

            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(onResize, 16); // ~60fps
            };

            // Store reference for cleanup
            canvasState.resizeHandler = debouncedResize;
            window.addEventListener('resize', canvasState.resizeHandler);
        };

        return {
            makeStage,
            makeLayers,
            makeCameraWrappers,
            makePseudoLayers,
            makeWorldRect,
            makeGrid,
            attachDragCamera,
            makeUi,
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
            makeUi,
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
            const cameraAPI = attachDragCamera();
            makeUi();

            const redTextGroup = new Konva.Group({
                draggable: true,
                name: 'group-red'
            });
            const yellowTextGroup = new Konva.Group({
                draggable: true,
                name: 'group-yellow'
            });
            const redBox = new Konva.Rect({
                x: 50,
                y: 50,
                width: 150,
                height: 100,
                fill: 'red',
                draggable: false
            });
            const yellowTransparentBox = new Konva.Rect({
                x: 250,
                y: 150,
                width: 150,
                height: 100,
                fill: 'yellow',
                opacity: 0.4,
                draggable: false
            });
            const redComplexText = new Konva.Text({
                x: 50,
                y: 50,
                width: 150,
                height: 100,
                padding: 5,
                align: 'center',
                fontSize: 10,
                fill: '#FFFFFF',
                text: "This is a simple text frame example.\n\n" +
                    "Its within the Items layer and does move with the camera."
            });
            const yellowComplexText = new Konva.Text({
                x: 250,
                y: 150,
                width: 150,
                height: 100,
                padding: 5,
                align: 'center',
                fontSize: 10,
                fill: '#000000',
                text: "This is a simple text frame example.\n\n" +
                    "Its within the Host layer and does move with the camera."
            });
            redTextGroup.add(redBox, redComplexText);
            yellowTextGroup.add(yellowTransparentBox, yellowComplexText);
            let stringLayer = getNodeByName('group-items-pseudoLayer-z-0');
            let hostLayer = getNodeByName('group-items-pseudoLayer-z-40');
            stringLayer.add(redTextGroup);
            hostLayer.add(yellowTextGroup);

            // One paint at the end:
            canvasState.stage.getLayers().forEach(l => l.batchDraw());
        } catch (err) {
            teardown();
            throw err; // surface the original error
        }

        console.log('finished');
        console.log(canvasState);

        // Enhanced Public API
        return {
            stage: canvasState.stage,
            camera: cameraAPI,
            addShape: (name, shape, layerName) => {
                const layer = getNodeByName(layerName);
                if (!layer) throw new Error(`Layer ${layerName} not found`);
                const shapeId = crypto.randomUUID();
                shape.id(shapeId);
                canvasState.shapes[shapeId] = shape;
                canvasState.index[name] = shapeId;
                layer.add(shape);
                return shape;
            },
            removeShape: removeByName,
            getShape: getNodeByName,
            destroy: teardown
        };
    };

    return {
        create
    };
})();

export {
    board
};
