import Konva from 'https://esm.sh/konva@9';

export const build = {
  setStageLayersGroups(kCanvas, canvasState, CONFIG) {
    console.log(CONFIG);
    // No Konva. Just mutate the same object you passed in.
    canvasState.stage = 'Hello';   // or whatever you want here
    const cats = 'cats';
    return { cats };
  }
};
