export const createUtility = ({ state, config }) => {
  // state is mutable (instance data)
  let s = state;
  const cfg = deepFreeze(structuredClone(config)); // or just config if you trust callers
  
  const addNode = () => {};
  const otherFunction = () => {};

  return { addNode, otherFunction };
};
