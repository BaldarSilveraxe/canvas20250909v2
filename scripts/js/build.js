import Konva from 'https://esm.sh/konva@9';

const build = ((kCanvas, canvasState) => {
        
        console.log(canvasState);
        console.log(kCanvas);
        
const setStageLayersGroups  = (kCanvas, canvasState) => {

        console.log('finished');
        console.log(canvasState);

        // Enhanced Public API
        return {
            stage: canvasState.stage
        };
    };
        
return {
        setStageLayersGroups
    };
})();

export {
    build
};
