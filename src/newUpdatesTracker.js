export default function newUpdatesTracker(transform = (d) => d) {
  let index = new Map();
  return (values = []) => {
    const newIndex = new Map();
    const list = [];
    for (let value of values) {
      const item = index.get(value) || transform(value);
      newIndex.set(value, item);
      list.push(item);
    }
    index = newIndex;
    return list;
  };
}