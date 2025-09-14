export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = ({ stateType, name, konvaNode }) => {
        const id = crypto.randomUUID();
        konvaNode.id(id);
        
        
        return { node: konvaNode, id }; // Make sure to return the object
    };
    
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
