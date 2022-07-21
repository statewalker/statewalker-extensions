import findDomSlots from "./findDomSlots.js"
import replaceDomContent from "./replaceDomContent.js";

export default function newSlotsUpdater(element, slotSelector, getSlotName) {
    const slotsElements = findDomSlots(element, slotSelector, getSlotName);
    let slotsEntries = Object.entries(slotsElements);
    if (!slotsEntries.length) slotsEntries = [["", element]];
    return (list = []) => {
      list = list.map(toDomSlots);
      for (const [name, slot] of slotsEntries) {
        const slots = list.map((d) => d[name]).filter((d) => !!d);
        replaceDomContent(slot, ...slots);
      }
    };
  }