import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const canvasState = {
        stage: null,
        layers: {},
        groups: {},
        shapes: {},
        index: {},
    };
    
    const config = {
        layers: ['world', 'items', 'ui'], // Used for creating layers and pseudo-layer 'layer-world' 'world-pseudo-layer' etc
        pseudoLayers: ['items-pseudo-layer-z-0', 'items-pseudo-layer-z-10', 'items-pseudo-layer-z-20', 'items-pseudo-layer-z-30', 'items-pseudo-layer-z-40'],
        RESERVED_NAMES: new Set([
            '_stage',
            'layer-world',
            'world-pseudo-layer',
            'layer-items',
            'items-pseudo-layer',
            'layer-ui',
            'ui-pseudo-layer',
            'items-pseudo-layer-z-0',
            'items-pseudo-layer-z-10',
            'items-pseudo-layer-z-20',
            'items-pseudo-layer-z-30',
            'items-pseudo-layer-z-40'
        ])
    };

    const build = () => {
        const makeStage = (cnvs) => {
            const kCanvasContainer = (typeof cnvs === 'string') ? document.getElementById(cnvs) : cnvs;
            if (!kCanvasContainer) {
                throw new Error('board.create: container not found');
            }
            const stageId = crypto.randomUUID();
            const stageName = "_stage";
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
                const layerId = crypto.randomUUID(),
                    groupId = crypto.randomUUID(),
                    layerName = `layer-${e}`,
                    groupName = `${e}-pseudo-layer`,
                    newLayer = new Konva.Layer({ id: layerId, name: layerName }),
                    newGroup = new Konva.Group({ id: groupId, name: groupName });
                canvasState.layers[layerId] = newLayer;
                canvasState.groups[groupId] = newGroup;
                canvasState.index[layerName] = layerId;
                canvasState.index[groupName] = groupId;
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
        
        //items-pseudo-layer
        for (let i = 0; i < 5; i++) {
            const groupId = crypto.randomUUID(),
                groupName = `items-pseudo-layer-z-${(i * 10)}`,
                newGroup = new Konva.Group({ id: groupId, name: groupName });
            canvasState.groups[groupId] = newGroup;
            canvasState.index[groupName] = groupId;
            console.log(groupName]
                //newLayer.add(newGroup);
        }
console.log(canvasState.groups[canvasState.index]['items-pseudo-layer']);
        
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
            stage: canvasState.stage
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
