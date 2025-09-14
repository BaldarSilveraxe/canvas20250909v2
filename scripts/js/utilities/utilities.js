export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = ({ stateType, name, konvaNode }) => {
        s.stage.add(konvaNode);
        
        return { node: konvaNode, id }; // Make sure to return the object
    };
    
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
