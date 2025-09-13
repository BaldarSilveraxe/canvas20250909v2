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
        cameraWraps: {
            worldCamera: 'group-world-pseudoLayer-camera-wrap', 
            itemsCamera: 'group-items-pseudoLayer-camera-wrap'
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
            fill: '#000000',
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
        const addNode = ({ stateType, name, konvaNode }) => {
            const validStateTypes = new Set(['layers', 'groups', 'shapes']);
            if (!validStateTypes.has(stateType)) {
                console.error(`Invalid stateType: ${stateType}. Must be one of layers, groups, or shapes.`);
                return null;
            }
            const id = crypto.randomUUID();
            konvaNode.id(id);
            canvasState[stateType][id] = konvaNode;
            canvasState.index[name] = id;
            return { id, node: konvaNode };
        };
        
        const clampAxis = (val, view, content) => {
            if (content <= view) return Math.round((view - content) / 2);
            const min = Math.floor(view - content);
            const max = 0;
            const v = Math.round(val);
            return Math.max(min, Math.min(v, max));
        };

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
        // Remove all event listeners first
        Object.values(canvasState.shapes).forEach(shape => shape.off());
        Object.values(canvasState.groups).forEach(group => group.off());
        Object.values(canvasState.layers).forEach(layer => layer.off());
        
        // Then cleanup
        if (canvasState.resizeHandler) {
            window.removeEventListener('resize', canvasState.resizeHandler);
            canvasState.resizeHandler = null;
        }
        canvasState.stage?.off();
        canvasState.stage?.destroy();
    } catch (error) {
        console.error('Error during teardown:', error);
    }
    // Reset state
    Object.assign(canvasState, {
        stage: null,
        layers: {},
        groups: {},
        shapes: {},
        index: {},
        resizeHandler: null
    });
};

        return {
            addNode,
            clampAxis,
            removeByName,
            getNodeByName,
            teardown
        };
    };

    const build = () => {
        const {
            addNode,
            clampAxis,
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
            const stage = canvasState.stage;
            const camWorld = getNodeByName('group-world-pseudoLayer-camera-wrap');
            const camItems = getNodeByName('group-items-pseudoLayer-camera-wrap');
            if (!camWorld || !camItems) throw new Error('[camera] wrappers missing');

            // --- Cached calculations helper -------------------------------------------
            const getViewportSize = () => {
                const c = stage.container();
                return {
                    vw: c.clientWidth || stage.width(),
                    vh: c.clientHeight || stage.height(),
                };
            };

            const getScaleConstraints = () => {
                const {
                    vw,
                    vh
                } = getViewportSize();
                // Calculate minimum scale to ensure world always fills viewport
                // Use the larger ratio to ensure both dimensions are at least viewport size
                const minScaleX = vw / config.world.width; // Scale needed to fill viewport width
                const minScaleY = vh / config.world.height; // Scale needed to fill viewport height
                const calculatedMin = Math.max(minScaleX, minScaleY); // Use whichever is larger

                return {
                    min: Math.max(config.zoom.scaleMin, calculatedMin),
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
                const {
                    vw,
                    vh
                } = getViewportSize();

                // use absolute scale in case a parent (layer) gets transformed in future
                const abs = camWorld.getAbsoluteScale();
                const sx = abs.x || 1;
                const sy = abs.y || 1;

                const W = Math.round(config.world.width * sx);
                const H = Math.round(config.world.height * sy);

                return {
                    x: clampAxis(pos.x, vw, W),
                    y: clampAxis(pos.y, vh, H)
                };
            };

            // --- PAN -------------------------------------------------------------------
            camWorld.draggable(true);
            camItems.draggable(false);
            camWorld.dragBoundFunc(clamp);
            camWorld.on('dragmove', sync);

            // --- UX niceties -----------------------------------------------------------
            const c = stage.container();
            const setCursor = (v) => {
                c.style.cursor = v;
            };
            const setSelect = (v) => {
                c.style.userSelect = v;
            };
            camWorld.on('mouseenter', () => setCursor('grab'));
            camWorld.on('mouseleave', () => setCursor('default'));
            camWorld.on('dragstart', () => {
                setCursor('grabbing');
                setSelect('none');
            });
            const endDrag = () => {
                setCursor('default');
                setSelect('auto');
            };
            camWorld.on('dragend', endDrag);

            const endDragHandler = endDrag;
            stage.on('contentMouseup', endDragHandler);
            stage.on('contentTouchend', endDragHandler);
            stage.on('contentMouseout', endDragHandler);

            // --- ZOOM (Alt/Option + wheel), with dynamic min-scale ---------------------
            stage.on('wheel', (e) => {
                if (!e.evt.altKey) return; // only when Alt is held
                e.evt.preventDefault(); // stop page scroll

                const oldScale = camWorld.scaleX() || 1;
                const scaleBy = 1.1;
                const dir = e.evt.deltaY > 0 ? 1 : -1;
                let newScale = dir > 0 ? oldScale / scaleBy : oldScale * scaleBy;

                // clamp zoom to dynamic min (and configured max) using cached constraints
                const {
                    min: minScale,
                    max: maxScale
                } = getScaleConstraints();
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

                camWorld.scale({
                    x: newScale,
                    y: newScale
                });
                camItems.scale({
                    x: newScale,
                    y: newScale
                });

                const bounded = clamp(newPos);
                camWorld.position(bounded);
                camItems.position(bounded);

                camWorld.getLayer()?.batchDraw();
                camItems.getLayer()?.batchDraw();
            });

            // --- Initial snap: enforce min scale & bounds ------------------------------
            {
                const s = camWorld.scaleX() || 1;
                const {
                    min: minScale
                } = getScaleConstraints();
                if (s < minScale) {
                    camWorld.scale({
                        x: minScale,
                        y: minScale
                    });
                    camItems.scale({
                        x: minScale,
                        y: minScale
                    });
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
                    const bounded = clamp({
                        x,
                        y
                    });
                    camWorld.position(bounded);
                    camItems.position(bounded);
                    camWorld.getLayer()?.batchDraw();
                    camItems.getLayer()?.batchDraw();
                },
                getCamera: () => ({
                    ...camWorld.position()
                }),
                getScaleConstraints, // Expose for external use
            };
        };

const makeBoardControls = () => {
const kObj  = new Konva.Group({
    name: 'contolGroup',
    x: 100,
    y: 100,
    width: 50,
    height: 500,
    draggable: true // False later
});
const container  = new Konva.Rect({
    name: 'contolGroup',
    x: 0,
    y: 0,
    width: 50,
    height: 500,
    fill: '#F5F5F5',
    stroke: '#696969',
    strokeWidth: 1,
    draggable: true // False later
});
const track1 = new Konva.Rect({
    x: 25,
    y: 5,
    offsetX: 5,
    offsetY: 0,
    width: 10,
    height: 200,
     cornerRadius: 5,
    fill: '#36454F',
    stroke: '#c9bab0',
    strokeWidth: 1
});
const bgr = new Konva.Rect({
    x: 0,
    y: 100,
    offsetX: 26,
    offsetY: 24,
    width: 52,
    height: 42,
    cornerRadius: 21,
    fill: '#36454F',
    stroke: '#c9bab0',
    strokeWidth: 1,
});

const bg = new Konva.Circle({
    x: 25,
    y: 25,
    offsetX: 0,
    offsetY: 0,
    radius: 21,
    fill: '#36454F',
    stroke: '#c9bab0',
    strokeWidth: 1
});
const bgc = new Konva.Circle({
    x: 25,
    y: 225,
    offsetX: 0,
    offsetY: 0,
    radius: 21,
    fill: '#36454F',
    stroke: '#c9bab0',
    strokeWidth: 1
});
//bgr.cache(); // important: do this before filters
//bgr.filters([Konva.Filters.Blur]);
//bgr.blurRadius(2); // try 1–3 for subtle softness
const path = new Konva.Path({
  x: 0,
  y: 0,
  width: 42,
  height: 42,
  data: 'M0 0v250.083a235.298 235.298 0 0 0 0 19.781V512h512V271.599c.278-7.074.277-14.165 0-21.25V0H0zm10 10h61.714v61.714H10V10zm71.714 0h61.714v16.157c-22.648 11.709-43.423 26.969-61.714 44.87V10zm71.714 0h29.66a232.98 232.98 0 0 0-29.66 11.275V10zm168.404 0h36.74v11.414c-1.216-.47-2.439-.93-3.668-1.382L321.832 10zm46.74 0h61.713v56.44c-17.894-16.64-38.53-30.577-61.714-40.874V10zm71.713 0H502v61.714h-61.715V10zM256.937 30.545c10.143-.43 20.13-.07 29.92 1.023v40.146h-61.714V32.771a219.824 219.824 0 0 1 31.794-2.226zm39.92 2.4c21.809 3.584 42.54 10.787 61.714 20.888v17.881h-61.714V32.946zm-81.715 1.487v37.282h-61.714V55.648a228.22 228.22 0 0 1 61.714-21.216zm153.43 25.014a223.257 223.257 0 0 1 18.413 12.268H368.57V59.446zm-225.144 1.661v10.607h-16.59a223.783 223.783 0 0 1 16.59-10.607zM10 81.714h61.372a278.85 278.85 0 0 0-42.785 61.714H10V81.714zm103.697 0h29.731v40.105l-35.335-35.335a216.763 216.763 0 0 1 5.604-4.77zm39.731 0h61.714v61.714h-50.105l-11.609-11.609V81.714zm71.715 0h61.714v61.714h-61.714V81.714zm71.714 0h61.714v61.714h-61.714V81.714zm71.714 0h30.984c11.17 9.536 21.462 20.144 30.73 31.602v30.112h-61.714V81.714zm76.71 0H502v61.714h-16.031c-10.554-22.42-24.183-43.316-40.687-61.714zM86.877 107.7l35.728 35.728h-40.89v-29.677a212.135 212.135 0 0 1 5.162-6.05zm353.41 18.871a246.506 246.506 0 0 1 10.85 16.857h-10.85v-16.857zm-368.572.358v16.5H61.225a220.261 220.261 0 0 1 10.489-16.5zM10 153.43h13.746A269.149 269.149 0 0 0 10 190.136v-36.709zm45.806 0h15.908v61.714H34.809c4.025-21.431 11.1-42.29 20.997-61.715zm25.908 0h50.89l10.824 10.824v50.89H81.714v-61.715zm93.323 0h40.105v40.104l-40.105-40.105zm50.106 0h61.714v61.714h-50.105l-11.61-11.61v-50.105zm71.714 0h61.714v61.714h-61.714v-61.715zm71.714 0h61.714v61.714h-61.714v-61.715zm71.714 0h16.416c10.249 19.466 17.857 40.285 22.336 61.714h-38.752v-61.715zm50.146 0H502v33.202a275.54 275.54 0 0 0-11.57-33.203zm-337.003 20.824 40.89 40.89h-40.89v-40.89zm-120.27 50.89h38.556v61.714H32.899c-2.8-20.478-2.65-41.293.259-61.714zm48.556 0h61.714v61.714H81.714v-61.714zm71.714 0h50.89l10.824 10.824v50.89h-61.714v-61.714zm93.324 0h40.105v40.105l-40.105-40.105zm50.105 0h61.714v61.714h-50.105l-11.61-11.61v-50.104zm71.714 0h61.714v61.714h-61.714v-61.714zm71.714 0h40.607c3.294 20.34 3.746 41.117.947 61.714h-41.554v-61.714zm-215.142 20.824 40.89 40.89h-40.89v-40.89zm-190.636 50.89h37.207v61.714H53.631c-7.875-15.968-13.696-33.258-17.027-51.736a211.756 211.756 0 0 1-2.097-9.978zm47.207 0h61.714v61.714H81.714v-61.714zm71.714 0h61.714v61.714h-61.714v-61.714zm71.715 0h50.89l10.824 10.824v50.89h-61.714v-61.714zm93.323 0h40.105v40.105l-40.105-40.105zm50.105 0h61.714v61.714H380.18l-11.609-11.609v-50.105zm71.714 0h39.934a195.276 195.276 0 0 1-11.728 39.193L457.63 358.57h-17.345v-61.714zm-143.428 20.824 40.89 40.89h-40.89v-40.89zM10 327.536a221.324 221.324 0 0 0 10.425 26.976c.499 1.36 1.01 2.714 1.533 4.06H10v-31.036zm492 6.019v25.016h-8.838A239.336 239.336 0 0 0 502 333.555zM10 368.57h16.13c10.358 23.206 24.363 43.84 41.076 61.715H10V368.57zm48.926 0h12.788v19.754a201.103 201.103 0 0 1-12.788-19.754zm22.788 0h61.714v61.715h-30.936c-11.179-8.79-21.516-18.608-30.778-29.381V368.57zm71.714 0h61.714v61.715h-61.714V368.57zm71.715 0h61.714v61.715h-61.714V368.57zm71.714 0h50.89l10.824 10.825v50.89h-61.714V368.57zm93.323 0h40.105v32.304L427 405.39l-36.819-36.819zm50.105 0h12.522l-1.937 4.019-10.585 14.544v-18.563zm48.424 0h13.29v61.715h-56.478c18.232-18.391 32.561-39.289 43.188-61.715zM368.57 389.396l37.211 37.212a196.937 196.937 0 0 1-3.954 3.678H368.57v-40.89zm47.912 27.216c-9.442 10.453-2.657 1.269 0 0zM10 440.286h61.714V502H10v-61.714zm116.222 0h17.206v10.56a238.42 238.42 0 0 1-17.206-10.56zm27.206 0h61.714v36.943a248.544 248.544 0 0 1-61.714-21.114v-15.83zm71.715 0h61.714v40.416c-20.463 2.184-41.269 1.55-61.714-1.68v-38.736zm71.714 0h61.714v19.625c-19.523 9.815-40.366 16.227-61.714 19.493v-39.118zm71.714 0h21.276a194.315 194.315 0 0 1-21.276 14.231v-14.231zm71.714 0H502V502h-61.715v-61.714zm-358.571 4.23c18.385 16.549 39.283 30.212 61.714 40.793v16.69H81.714v-57.484zm348.571.977V502h-61.714v-13.642c22.417-10.546 43.314-24.77 61.714-42.865zm33.748.944c-.155-.013-.486-.015-1.076.012.428.18 1.542.03 1.076-.012zM153.428 489.78A275.666 275.666 0 0 0 188.907 502h-35.479v-12.22zm205.143 3V502h-26.58a240.478 240.478 0 0 0 26.58-9.22z',
  fill: 'black',
  scale: {
    x: 0.08203125,
    y: 0.08203125
  }
});
kObj.add(container);
kObj.add(path);
//kObj.add(bgr);    
kObj.add(bg);
//kObj.add(bgc);
const targetGroup = getNodeByName('group-ui-pseudoLayer-main');
targetGroup.add( kObj);

    const tr = new Konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: ['top-left','top-right','bottom-left','bottom-right','top-center','bottom-center','middle-left','middle-right'],
      anchorSize: 8,
      borderStroke: '#9AE6B4',
      anchorStroke: '#9AE6B4',
      anchorFill: '#0b0d0f',
      padding: 4
    });
   targetGroup.add(tr);

    canvasState.stage.on('click', (e) => {
      const g = e.target.findAncestor('Group');
      if (g /*&& cards.includes(g)*/) tr.nodes([g]); else tr.nodes([]);
    });
    tr.on('transform transformend', () => { for (const l of links) l.update(); });
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
                    const scale = shape.getAbsoluteScale();

                    // Hide grid below 100% zoom - too dense to be useful
                    if (scale.x < 1.0 || scale.y < 1.0) {
                        return; // Early exit - don't render anything
                    }

                    context.save();

                    // Scale-compensated line widths
                    const lwMinorV = strokeWidthMinor / scale.x;
                    const lwMinorH = strokeWidthMinor / scale.y;
                    const lwMajorV = strokeWidthMajor / scale.x;
                    const lwMajorH = strokeWidthMajor / scale.y;

                    // Scale-compensated dash patterns
                    const dashX = (dash) => (dash && dash.length) ? dash.map(d => d / scale.x) : [];
                    const dashY = (dash) => (dash && dash.length) ? dash.map(d => d / scale.y) : [];

                    // Scale-aware half-pixel alignment (only matters at >= 100% now)
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
            let targetGroup, kObj, node;
            targetGroup = getNodeByName('group-world-pseudoLayer-background');
            if (!targetGroup) throw new Error('[makeWorldRect] pseudo layer not found');
            kObj = new Konva.Rect({ ...config.world });
            ({ node } = addNode({ stateType: 'shapes', name: name, konvaNode: kObj }));
            targetGroup.add(node);
        };

        const makePseudoLayers = () => {
            let targetGroup, kObj, node;
            Object.keys(config.pseudoLayers).forEach(key => {
                targetGroup = getNodeByName(config.pseudoLayers[key].group);
                if (!targetGroup) throw new Error('[makePseudoLayers] target group not found');
                config.pseudoLayers[key].pseudos.forEach(name => {
                    kObj= new Konva.Group({ name: name });
                    ({ node } = addNode({ stateType: 'groups', name: name, konvaNode: kObj }));
                    targetGroup.add(node);
                });
            });
        };

        const makeCameraWrappers = () => {
            let name, theLayer, kObj, node;
            name = config.cameraWraps.worldCamera;
            theLayer = getNodeByName('layer-world');
            kObj  = new Konva.Group({ name: name, draggable: true });
            ({ node } = addNode({ stateType: 'groups', name: name, konvaNode: kObj }));
            theLayer.add(node);
            name = config.cameraWraps.itemsCamera;
            theLayer = getNodeByName('layer-items');
            kObj  = new Konva.Group({ name: name, draggable: true });
            ({ node } = addNode({ stateType: 'groups', name: name, konvaNode: kObj }))
            theLayer.add(node);
        };

        const makeLayers = () => {
            config.layers.forEach(function(e, i) {
                let name = `layer-${e}`;
                let kObj  = new Konva.Layer({
                    name: name,
                    listening: true
                });
                const { node } = addNode({
                    stateType: 'layers',
                    name: name,
                    konvaNode: kObj
                });
                canvasState.stage.add(node);
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
            container.style.margin = '0';
            container.style.border = '0';

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
                canvasState.stage.size({
                    width: nw,
                    height: nh
                });

                const camWorld = getNodeByName('group-world-pseudoLayer-camera-wrap');
                const camItems = getNodeByName('group-items-pseudoLayer-camera-wrap');
                if (!camWorld || !camItems) return;

                // Use the same scale constraint logic as in getScaleConstraints
                const minScaleX = nw / config.world.width;
                const minScaleY = nh / config.world.height;
                const calculatedMin = Math.max(minScaleX, minScaleY);
                const minScale = Math.max(config.zoom.scaleMin, calculatedMin);

                const s = camWorld.scaleX() || 1;
                if (s < minScale) {
                    camWorld.scale({
                        x: minScale,
                        y: minScale
                    });
                    camItems.scale({
                        x: minScale,
                        y: minScale
                    });
                }

                // re-clamp the current position (shared clamping logic)
                const abs = camWorld.getAbsoluteScale();
                const sx = abs.x || 1;
                const sy = abs.y || 1;
                const W = Math.round(config.world.width * sx);
                const H = Math.round(config.world.height * sy);

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
            makeBoardControls,
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
            makeBoardControls,
            attachDragCamera,
            makeUi,
            removeByName,
            getNodeByName,
            teardown
        } = build();

        let cameraAPI; // Declare cameraAPI outside the try block

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
            cameraAPI = attachDragCamera(); // Assign to the declared variable
            makeUi();
            makeBoardControls();

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
            camera: cameraAPI, // Now cameraAPI is properly defined
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
