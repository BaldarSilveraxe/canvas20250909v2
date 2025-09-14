export const createUtility = ({ state, config }) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;

    const addReserveName = (string) => {
        if (!s.reservedName.has(string)) {
            s.reservedName.add(string);
        }
    };
    const addNode = ({ name, id, konvaNode }) => {
        s.stage.add(konvaNode);
        s.indexId[id] = name;
        s.indexName[name] = id;
        return { node: konvaNode, id };
    };

    const getNodeByName = (name) => {
        const nodeId = s.indexName[name];
        if (!nodeId) return null;
        return s.stage.find(`#${nodeId}`);
    };

    return { addReserveName, addNode, getNodeByName};
};
