export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = ({ stateType, name, konvaNode }) => {
        const id = crypto.randomUUID();
        konvaNode.id(id);
        state.stage.add(konvaNode);
    };
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
