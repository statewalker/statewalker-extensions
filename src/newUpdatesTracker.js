export default function newUpdatesTracker(onEnter = d => d, onExit = d => d) {
  let index = new Map();
  return (values = []) => {
    const newIndex = new Map();
    const list = [];
    for (let value of values) {
      const item = index.get(value) || onEnter(value);
      index.delete(value);
      newIndex.set(value, item);
      list.push(item);
    }
    index.forEach(onExit);
    index = newIndex;
    return list;
  };
}