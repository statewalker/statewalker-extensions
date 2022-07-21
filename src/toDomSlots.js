export default function toDomSlots(value) {
    // if (typeof value === "function") value = value();
    const slots = {};
    value = visitValue(value);
    if (value) slots[""] = value;
    return slots;
  
    function visitValue(value, serialize = false) {
      if (value === undefined) return;
      if (value === null) value = "";
      if (typeof value === "number" || typeof value === "boolean")
        value = String(value);
      if (
        typeof value === "object" &&
        !(value instanceof Element || value instanceof Text)
        // && !(value instanceof value.constructor)
      ) {
        if (serialize) {
          value = Object.prototype.toString.call(value);
        } else {
          for (let [name, val] of Object.entries(value)) {
            val = visitValue(val, true);
            if (val) slots[name] = val;
          }
          value = undefined;
        }
      }
      if (typeof value === "string") value = document.createTextNode(value);
      return value;
    }
  }