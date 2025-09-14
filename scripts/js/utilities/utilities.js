export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = ({ name, id, konvaNode }) => {
        s.stage.add(konvaNode);
        s.indexId[id] = name;
        s.indexName[name] = id;
        return { node: konvaNode, id };
    };
    
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
