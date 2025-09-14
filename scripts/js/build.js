import Konva from 'https://esm.sh/konva@9';
import { getId } from './utilities/getId.js';


const makeStage = (el, state, config) => {
    Object.assign(el.style, config.build.stage.elStyle);
    state.stage = new Konva.Stage({
        id: getId(),
        name: config.build.stage.name,
        container: el,
        width: el.clientWidth,
        height: el.clientHeight, 
    });
};

const makeLayers = (state, config) => {

};

const teardown = (state) => {
    if (state.stage) {
        state.stage.destroy();
        state.stage = null;
    }
    // Clear other state
    Object.keys(state.layers).forEach(key => delete state.layers[key]);
    Object.keys(state.groups).forEach(key => delete state.groups[key]);
    Object.keys(state.shapes).forEach(key => delete state.shapes[key]);
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
            makeStage(htmlContainer, state, config);
            
            if (!state.stage) {
                throw new Error('setStageLayersGroups: stage not created');
            }
            
            makeLayers(state, config);
            
            // Batch draw all layers
            //state.stage.getLayers().forEach(layer => layer.batchDraw());
            
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
