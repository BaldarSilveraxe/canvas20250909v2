import Konva from 'https://esm.sh/konva@9';
import addGridGroup from './features/board/grid.js';
import DEFAULT_CONFIG from './configuration/board/DEFAULT_CONFIG.js?d=2&ddd=1';

const board = (() => {
    const create = (kCanvas) => {
        console.log('here');

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
