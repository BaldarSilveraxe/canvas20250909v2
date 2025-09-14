import Konva from 'https://esm.sh/konva@9';
import { getIds } from './utilities/getIds.js';


const makeStage = (el, state, config) => {
    // Ensure the container is viewport-sized and doesn't scroll
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.overflow = 'hidden';
    el.style.padding = '0';
    el.style.margin = '0';
    el.style.border = '0';

    state.stage = new Konva.Stage({
        id: getIds(),
        name: '_stage',
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
            
            //if (!state.stage) {
            //    throw new Error('setStageLayersGroups: stage not created');
            //}
            
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
