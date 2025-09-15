import Konva from 'https://esm.sh/konva@9';
import { getId } from './utilities/getId.js';
import { createUtility } from './utilities/utilities.js';

const makeStage = (el, state, config, util) => {
    Object.assign(el.style, config.build.stage.elStyle);
    state.stage = new Konva.Stage({
        id: getId(),
        name: config.build.stage.name,
        container: el,
        width: el.clientWidth,
        height: el.clientHeight, 
    });
    util.addReserveName(config.build.stage.name);
};

const makeLayers = (state, config, util) => {  // Add util parameter
    Object.keys(config.build.layers).forEach(key => {
            let genId = getId(), kObj = new Konva.Layer({
            id: genId,
            name: config.build.layers[key].layerName,
            listening: true
        });
        const { node, id } = util.addNode({
            name: config.build.layers[key].layerName,
            id: genId,
            konvaNode: kObj
        });
        state.stage.add(kObj);
        util.addReserveName(config.build.layers[key].layerName);
    });
};

const makeCameraWrappers = (state, config, util) => {
    let name, theLayer, kObj, node, genId; 
    Object.keys(config.build.layers).forEach(key => {
        if (config.build.layers[key].cameraName &&
           state.indexName[config.build.layers[key].layerName]) {
            name = config.build.layers[key].cameraName;
            genId = getId();
            theLayer = state.stage.findOne(`#${state.indexName[config.build.layers[key].layerName]}`); 
            kObj  = new Konva.Group({ name: name, draggable: true });
            ({ node } = util.addNode({ name: name, id: genId, konvaNode: kObj }));
            theLayer.add(node);
            util.addReserveName(name);
        }
    });
};

const makePseudoLayers = (state, config, util) => {
    let targetGroup, genId, kObj, node;
    Object.keys(config.build.pseudoLayers).forEach(key => {
        if (config.build.layers[key] &&
            config.build.layers[key].layerName) {
            targetGroup = state.stage.findOne(`#${state.indexName[config.build.layers[key].layerName]}`);
            if (!targetGroup) throw new Error('[makePseudoLayers] target group not found');
            config.build.pseudoLayers[key].pseudos.forEach(name => {
                genId = getId();
                kObj  = new Konva.Group({ name: name, draggable: true });
                ({ node } = util.addNode({ name: name, id: genId, konvaNode: kObj }));
                targetGroup.add(node);
                util.addReserveName(name);
            });
        }
    });
};

        const makeWorldRect = (state, config, util) => {
            let targetGroup, kObj, node;
            console.log(config.build.pseudoLayers.world.pseudos.background);
            //targetGroup = getNodeByName('group-world-pseudoLayer-background');
            //if (!targetGroup) throw new Error('[makeWorldRect] pseudo layer not found');
            //kObj = new Konva.Rect({ ...config.world });
            //({ node } = addNode({ stateType: 'shapes', name: name, konvaNode: kObj }));
            //targetGroup.add(node);
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
        state.reservedName = {};
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
        
        if (!htmlContainer) throw new Error('setStageLayersGroups: htmlContainer is required');
        if (!state) throw new Error('setStageLayersGroups: state is required');
        if (!config) throw new Error('setStageLayersGroups: config is required');
        
        try {
            const util = createUtility({ state, config });
            makeStage(htmlContainer, state, config, util);
            
            if (!state.stage) {
                throw new Error('setStageLayersGroups: stage not created');
            }
            
            makeLayers(state, config, util);  // Pass util as parameter
            makeCameraWrappers(state, config, util);
            makePseudoLayers(state, config, util);
            makeWorldRect(state, config, util);

            console.log(state);
            
            // Batch draw all layers
            state.stage.getLayers().forEach(layer => layer.batchDraw());
            
        } catch (err) {
            teardown(state);
            throw err;
        }
        
        return {
            //stage: state.stage,
            //layers: state.layers,
            // Add other API methods as needed
        };
    }
};
