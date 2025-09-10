import Konva from 'https://esm.sh/konva@9';
//import addGridGroup from './features/board/grid.js';
//import DEFAULT_CONFIG from './configuration/board/DEFAULT_CONFIG.js?d=2&ddd=1';

const board = (() => {

const build = () => {
    const stage = (cnvs) => {
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
    return { stage };
})();

    const create = (kCanvas) => {
        const stage = build.stage(kCanvas);


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
    return { create };
})();

export { board };
