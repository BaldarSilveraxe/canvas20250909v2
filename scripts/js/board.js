import Konva from 'https://esm.sh/konva@9';

const board = (() => {

    const canvasState = {};
    
    const config = {
        layers: ['world', 'items', 'ui'],
    };

    const build = () => {
        const makeStage = (cnvs) => {
            const kCanvasContainer = (typeof cnvs === 'string') ? document.getElementById(cnvs) : cnvs;
            if (!kCanvasContainer) {
                throw new Error('board.create: container not found');
            }
            return new Konva.Stage({
                container: kCanvasContainer,
                width: kCanvasContainer.clientWidth,
                height: kCanvasContainer.clientHeight,
            });
        };

        const makeLayer = (props = {}) => {
            if (!props.id) throw new Error('makeLayer: "id" is required');
            return new Konva.Layer(props);
        };

        return {
            makeStage,
            makeLayer
        };
    };

    const create = (kCanvas) => {

        const {
            makeStage,
            makeLayer
        } = build();

        const stage = makeStage(kCanvas);

        config.layers.forEach(function(e, i) {
            // Corrected syntax: separate declarations
            const layerId = crypto.randomUUID();
            const groupId = crypto.randomUUID();
            const newLayer = makeLayer({ id: layerId, name: `layer-${e}` });
            const newGroup = new Konva.Group({ id: groupId, name: `group-${e}` });
            canvasState[layerId] = newLayer;
            canvasState[groupId] = newGroup;
            stage.add(newLayer);
            newLayer.add(newGroup);
        });

        const targetGroup = stage.findOne('.world-group');

// Step 3: Add the new group to the target
//const newGroup = new Konva.Group({ id: `test`, name: `test` });
//if (targetGroup) {
//    targetGroup.add(newGroup);
//}
        
        //const newGroup = new Konva.Group({ id: `test`, name: `test` });
        //stage.child[0].child[0].add(newGroup); 
        const now = new Date();
        console.log(now);
        console.log(stage);
        
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
