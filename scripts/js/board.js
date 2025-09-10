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
            stage.add(makeLayer({ id: `layer${i}`, name: e }));
        });

        //const itemsGroup = new Konva.Group({ id: 'items0', name: 'items' });
        //const overlayGroup = new Konva.Group({ id: 'ui0', name: 'ui' });
        stage.children[0].add(new Konva.Group({ id: 'world0', name: 'world' }));
        //layers.worldLayer
        //layers.itemsLayer.add(itemsGroup);
        //layers.overlayLayer.add(overlayGroup);

        
        const now = new Date();
        console.log(now);
        console.log(stage);

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
