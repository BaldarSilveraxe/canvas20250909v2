export const createUtility = ({
    state,
    config
}) => {
    // state is mutable (instance data)
    let s = state;
    const cfg = config;

    const addReserveName = (string) => {
        if (!s.reservedName.has(string)) {
            s.reservedName.add(string);
        }
    };

    const addNode = ({
        name,
        id,
        konvaNode
    }) => {
        if (s.indexName[name]) {
            throw new Error(`Node name '${name}' already exists`);
        }
        if (s.indexId[id]) {
            throw new Error(`Node id '${id}' already exists`);
        }
        s.indexId[id] = name;
        s.indexName[name] = id;
        return {
            node: konvaNode,
            id
        };
    };

    const getNodeByName = (name) => {
        const nodeId = s.indexName[name];
        if (!nodeId) return null;
        return s.stage.find(`#${nodeId}`);
    };

    return {
        addReserveName,
        addNode,
        getNodeByName
    };
};
