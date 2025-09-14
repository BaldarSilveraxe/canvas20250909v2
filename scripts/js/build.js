import Konva from 'https://esm.sh/konva@9';
import { getId } from './utilities/getId.js';
import { createUtility } from './utilities/utilities.js';

const makeStage = (el, state, config) => {
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
    config.build.layers.forEach(function(layerName, i) {
        let genId = getId(), kObj = new Konva.Layer({
            id: genId,
            name: layerName,
            listening: true
        });
        const { node, id } = util.addNode({
            name: layerName,
            id: genId,
            konvaNode: kObj
        });
        util.addReserveName(layerName);
    });
};

const teardown = (state) => {
    if (state.stage) {
        state.stage.destroy();
        state.stage = null;
    }
    if (state.indexId) {
        indexId: {};
    }
    if (state.indexName) {
        indexName: {};
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
            makeStage(htmlContainer, state, config);
            
            if (!state.stage) {
                throw new Error('setStageLayersGroups: stage not created');
            }
            
            makeLayers(state, config, util);  // Pass util as parameter
            
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
