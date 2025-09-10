import Konva from 'https://esm.sh/konva@9';

const board = (() => {
    const config = {
        layers: ['world','items','ui']
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
            const newLayer = makeLayer({ id: `layer${i}`, name: `layer-${e}`});
            const newGroup = new Konva.Group({ id: `group${i}`, name: `group-${e}` });
    
            stage.add(newLayer);
            newLayer.add(newGroup);
        });

        //stage.children[0].add(new Konva.Group({ id: 'world0', name: 'world' }));
        //stage.children[1].add(new Konva.Group({ id: 'items0', name: 'items' }));
        //stage.children[2].add(new Konva.Group({ id: 'ui0', name: 'ui' }));

        
        const now = new Date();
        console.log(now);
        console.log(stage);
        stage.destroy();
        // Public API
        return {
            //stage,
            //layers: {
            //    world: layers.worldLayer,
            //    items: layers.itemsLayer
            //},
            //groups: {
            //    world: groups.worldGroup,
            //    items: groups.itemsGroup,
            //    grid_group: worldContent.gridGroup
            //},
            //camera: cameraSystem.camera,
            //centerWorld: cameraSystem.centerWorld,
            //setGridVisible: keyboardHandlers.setGridVisible,
            //toggleGrid: keyboardHandlers.toggleGrid
        };
    };

    return {
        create
    };
})();

export {
    board
};
