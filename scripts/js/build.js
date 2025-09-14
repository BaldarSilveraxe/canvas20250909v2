export const build = {
    /**
    * @param {Object} opts
    * @param {HTMLElement} opts.htmlContainer
    * @param {Object} opts.state
    * @param {Object} [opts.config]
    */

    const makeStage = (el) => {

    }

    setStageLayersGroups(opts = {}) {
        const {
            htmlContainer,
            state,
            config,
        } = opts;
        
        if (!htmlContainer) throw new Error('setStageLayersGroups: htmlContainer is required');
        if (!state) throw new Error('setStageLayersGroups: state is required');

        try {
            makeStage(htmlContainer);
            if (!(canvasState.stage instanceof Konva.Stage)) {
                throw new Error('board.create: stage not created');
            }
            //makeLayers();

            //canvasState.stage.getLayers().forEach(l => l.batchDraw());
        } catch (err) {
            //teardown();
            throw err;
        }

        return {  };
    }
};
