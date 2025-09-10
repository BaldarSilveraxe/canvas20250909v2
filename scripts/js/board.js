import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const canvasState = {
        stage: null,
        layers: {},
        groups: {},
        shapes: {}
    };
    
    const config = {
        layers: ['world', 'items', 'ui'],
    };

    const build = () => {
        const makeStage = (cnvs) => {
            const kCanvasContainer = (typeof cnvs === 'string') ? document.getElementById(cnvs) : cnvs;
            if (!kCanvasContainer) {
                throw new Error('board.create: container not found');
            }
            const stageId = crypto.randomUUID();
            const stageName = "stage";
            canvasState.stage = new Konva.Stage({
                id: stageId,
                name: stageName,
                container: kCanvasContainer,
                width: kCanvasContainer.clientWidth,
                height: kCanvasContainer.clientHeight,
            });
        };

        const makeLayers = (props = {}) => {
            config.layers.forEach(function(e, i) {
                const layerId = crypto.randomUUID();
                const groupId = crypto.randomUUID();
                const newLayer = new Konva.Layer({ id: layerId, name: `layer-${e}` });
                const newGroup = new Konva.Group({ id: groupId, name: `group-${e}` });
                canvasState.layers[layerId] = newLayer;
                canvasState.groups[groupId] = newGroup;
                canvasState.stage.add(newLayer);
                newLayer.add(newGroup);
            });
        };

        return {
            makeStage,
            makeLayers
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayers
        } = build();

        makeStage(kCanvas);
        makeLayers();

        //const targetGroup = stage.findOne('.world-group');

// Step 3: Add the new group to the target
//const newGroup = new Konva.Group({ id: `test`, name: `test` });
//if (targetGroup) {
//    targetGroup.add(newGroup);
//}
        
        //const newGroup = new Konva.Group({ id: `test`, name: `test` });
        //stage.child[0].child[0].add(newGroup); 
        const now = new Date();
        console.log(now);
        console.log(canvasState.stage);
        console.log(canvasState);
        
        // Removed: Don't destroy the stage immediately after creating it
        // stage.destroy(); 
        
        // Public API
        return {
            stage
            // You should return the stage and other useful objects here
            // so they can be used outside the module.
            // ... (rest of the public API)
        };
    };

    return {
        create
    };
})();

export {
    board
};
