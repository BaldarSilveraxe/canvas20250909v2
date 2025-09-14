export const const utility = () => {
        const addNode = ({ stateType, name, konvaNode }) => {
            const validStateTypes = new Set(['layers', 'groups', 'shapes']);
            if (!validStateTypes.has(stateType)) {
                console.error(`Invalid stateType: ${stateType}. Must be one of layers, groups, or shapes.`);
                return null;
            }
            const id = crypto.randomUUID();
            konvaNode.id(id);
            canvasState[stateType][id] = konvaNode;
            canvasState.index[name] = id;
            return { id, node: konvaNode };
        };
}
