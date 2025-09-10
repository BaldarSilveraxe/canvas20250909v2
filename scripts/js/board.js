import Konva from 'https://esm.sh/konva@9';

const board = (() => {
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
        
        const makeLayer = (prop = {}) => {
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
        console.log(stage);
        
        stage.add(makeLayer(id: 'world', name: 'world'));
        stage.add(makeLayer(id: 'items', name: 'items'));
        stage.add(makeLayer(id: 'cntrl', name: 'cntrl'));
        console.log(makeLayer);
        console.log(stage);
        const now = new Date();
        console.log(now);

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
