export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;
  
    const addNode = ({ name, id, konvaNode }) => {
        //s.stage.add(konvaNode);
        console.log(name);
        console.log(s);
        console.log(id);
        s.indexId[id] = name;
        s.IndexName[name] = id;
        return { node: konvaNode, id };
    };
    
    const otherFunction = () => {};

    return { addNode, otherFunction };
};
