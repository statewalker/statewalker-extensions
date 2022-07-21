export default function newUpdatesTracker(transform = (d) => d) {
    let index = new Map();
    return (values = []) => {
      const newIndex = new Map();
      const list = [];
      for (let value of values) {
        let item = index.get(value);
        const idx = list.length;
        if (!item) index.set(value, (item = transform(value, idx)));
        list.push(item);
      }
      return list;
    };
  }