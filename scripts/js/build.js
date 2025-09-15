import Konva from 'https://esm.sh/konva@9';
import {
    getId
} from './utilities/getId.js';
import {
    createUtility
} from './utilities/utilities.js';

const makeStage = (el, state, config, util) => {
    let genId = getId();
    Object.assign(el.style, config.build.stage.elStyle);
    state.stage = new Konva.Stage({
        id: genId,
        name: config.build.stage.name,
        container: el,
        width: el.clientWidth,
        height: el.clientHeight,
    });
    util.addReserveName(config.build.stage.name);
    return {
        [config.build.stage.name]: {
            node: state.stage,
            name: config.build.stage.name,
            id: genId,
            type: 'stage',
            parent: el.id
            }
        };
};

const makeLayers = (state, config, util) => { // Add util parameter
    let r = {};
    Object.keys(config.build.layers).forEach(key => {
        let genId = getId(),
            kObj = new Konva.Layer({
                id: genId,
                name: config.build.layers[key].layerName,
                listening: true
            });
        const {
            node,
            id
        } = util.addNode({
            name: config.build.layers[key].layerName,
            id: genId,
            konvaNode: kObj
        });
        state.stage.add(kObj);
        util.addReserveName(config.build.layers[key].layerName);
        r[config.build.layers[key].layerName] = {
            node: kObj,
            name: config.build.layers[key].layerName,
            id: genId,
            type: 'layer',
            parent: state.stage.id() 
        };
    });
    return r;
};

const makeCameraWrappers = (state, config, util) => {
    let name, theLayer, kObj, node, genId, r = {};
    Object.keys(config.build.layers).forEach(key => {
        if (config.build.layers[key].cameraName &&
            state.indexName[config.build.layers[key].layerName]) {
            name = config.build.layers[key].cameraName;
            genId = getId();
            theLayer = state.stage.findOne(`#${state.indexName[config.build.layers[key].layerName]}`);
            kObj = new Konva.Group({
                name: name,
                id: genId,
                draggable: true
            });
            ({
                node
            } = util.addNode({
                name: name,
                id: genId,
                konvaNode: kObj
            }));
            theLayer.add(node);
            util.addReserveName(name);
            r[name] = { 
                node: node,
                name: name,
                id: genId,
                type: 'group',
                parent: state.indexName[config.build.layers[key].layerName]
            };
        }
    });
    return r;
};

const makePseudoLayers = (state, config, util) => {
    let targetGroup, genId, kObj, node, r = {};
    Object.keys(config.build.pseudoLayers).forEach(key => {
        targetGroup = state.stage.findOne(`#${state.indexName[config.build.pseudoLayers[key].group]}`);
        if (!targetGroup) {
            throw new Error(`[makePseudoLayers] Camera wrapper '${config.build.pseudoLayers[key].group}' not found`);
        }
        config.build.pseudoLayers[key].pseudos.forEach(name => {
            genId = getId();
            kObj = new Konva.Group({
                name: name,
                id: genId,
                // draggable: true
            });
            ({
                node
            } = util.addNode({
                name: name,
                id: genId,
                konvaNode: kObj
            }));
            targetGroup.add(node);
            util.addReserveName(name);
            r[name] = { 
                node: node,
                name: name,
                id: genId,
                type: 'group',
                parent: state.indexName[config.build.pseudoLayers[key].group]
            };
        });
    });
    return r;
};

const makeWorldRect = (state, config, util) => {
    let targetGroup, genId, kObj, node;
    targetGroup = state.stage.findOne(`#${state.indexName[config.build.pseudoLayers.world.background]}`);
    if (!targetGroup) throw new Error('[makeWorldRect] pseudo layer not found');
    genId = getId();
    kObj = new Konva.Rect({
        x: config.build.world.x,
        y: config.build.world.y,
        width: config.build.world.width,
        height: config.build.world.height,
        fill: config.build.world.fill,
        listening: config.build.world.listening,
        id: genId
    });
    ({
        node
    } = util.addNode({
        name: config.build.world.name,
        id: genId,
        konvaNode: kObj
    }));
    targetGroup.add(node);
    util.addReserveName(config.build.world.name);
    return { [config.build.world.name]: 
        { 
            node: node,
            name: config.build.world.name,
            id: genId,
            type: 'shape',
            parent: state.indexName[config.build.pseudoLayers.world.background]
        }
    };
};

const teardown = (state) => {
    if (state.stage) {
        state.stage.destroy();
        state.stage = null;
    }
    if (state.indexId) {
        state.indexId = {};
    }
    if (state.indexName) {
        state.indexName = {};
    }
    if (state.reservedName) {
        state.reservedName.clear();
    }
};

export const build = {
    /**
     * @param {Object} opts
     * @param {HTMLElement} opts.htmlContainer
     * @param {Object} opts.state
     * @param {Object} [opts.config]
     */
    setStageLayersGroups(opts = {}) {
        const {
            htmlContainer,
            state,
            config,
        } = opts;

        let buildTree = {
            stage: {},
            layers: {},
            camWrap: {},
            pseudoLayers: {},
            shapes: {}
        };

        if (!htmlContainer) throw new Error('setStageLayersGroups: htmlContainer is required');
        if (!state) throw new Error('setStageLayersGroups: state is required');
        if (!config) throw new Error('setStageLayersGroups: config is required');

        try {
            const util = createUtility({
                state,
                config
            });
            buildTree.stage = makeStage(htmlContainer, state, config, util);

            if (state.stage) {
                buildTree.layers = makeLayers(state, config, util); // Pass util as parameter
                buildTree.camWrap = makeCameraWrappers(state, config, util);
                buildTree.pseudoLayers = makePseudoLayers(state, config, util);
                buildTree.shapes = makeWorldRect(state, config, util);
                // Batch draw all layers
                state.stage.batchDraw();
            } else {
                throw new Error('setStageLayersGroups: stage not created');
            }

        } catch (err) {
            teardown(state);
            throw err;
        }

        console.log(buildTree);
        
        return {
            getStage: () => state.stage,
            teardown: () => teardown(state),
            buildTree
        };
    }
};
