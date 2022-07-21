export default function findDomSlots(element, selector = "slot", getName = (elm) => elm.getAttribute("name")) {
    const slots = {};
    for (let slot of [...element.querySelectorAll(selector)]) {
      const  name = getName(slot) || '';
      slots[name] = slot;
    }
    return slots;
  }