import Konva from 'https://esm.sh/konva@9';

const build = (() => {
        
        console.log(canvasState);
        console.log(kCanvas);
        
const setStageLayersGroups  = (kCanvas, canvasState) => {

        console.log(kCanvas);
        console.log(canvasState);

//canvasState.stage = "hello";

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
