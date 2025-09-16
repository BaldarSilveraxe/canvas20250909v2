import Konva from 'https://esm.sh/konva@9';
import {
    getId
} from './utilities/getId.js';
import {
    createUtility
} from './utilities/utilities.js';

const makeStage = (el, {
    build: {
        stage: {
            elStyle,
            name
        }
    }
}, util) => {
    if (!name) { 
        throw new Error("Config missing stage name.");
    }
    if (elStyle) {
        Object.assign(el.style, elStyle);
    }
    const stage = new Konva.Stage({
        id: util.getId(), 
        name: name,
        container: el,
        width: el.clientWidth,
        height: el.clientHeight,
    });
    util.addReserveName(name);
    return {
        [name]: stage
    };
};
//const makeStage = (el, state, config, util) => {
    //let genId = getId();
    //Object.assign(el.style, config.build.stage.elStyle);
    //state.stage = new Konva.Stage({
    //    id: genId,
    //    name: config.build.stage.name,
    //    container: el,
    //    width: el.clientWidth,
    //    height: el.clientHeight,
    //});
    //util.addReserveName(config.build.stage.name);
    //return {[config.build.stage.name]: state.stage};
//};

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
        r[config.build.layers[key].layerName] = kObj;
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
            r[name] = node;
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
            r[name] = node;
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
    return { [config.build.world.name]: node};
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

        let ref = {
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
            ref.stage = makeStage(htmlContainer, state, config, util);

            if (state.stage) {
                ref.layers = makeLayers(state, config, util); // Pass util as parameter
                ref.camWrap = makeCameraWrappers(state, config, util);
                ref.pseudoLayers = makePseudoLayers(state, config, util);
                ref.shapes = makeWorldRect(state, config, util);
                // Batch draw all layers
                state.stage.batchDraw();
            } else {
                throw new Error('setStageLayersGroups: stage not created');
            }

        } catch (err) {
            teardown(state);
            throw err;
        }

        console.log(ref);
        
        return {
            getStage: () => state.stage,
            teardown: () => teardown(state),
            ref
        };
    }
};
