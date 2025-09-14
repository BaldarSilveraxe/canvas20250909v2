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

        console.log(CONFIG);

        canvasState.stage = 'Hello';   // or whatever you want here
        const cats = 'cats';
        return { cats };
    }
};
