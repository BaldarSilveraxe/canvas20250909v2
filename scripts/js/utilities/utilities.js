export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = () => {
        const id = crypto.randomUUID();
        konvaNode.id(id);  
    };
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
