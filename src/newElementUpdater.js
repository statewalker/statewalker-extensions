import { newUpdatesTracker } from "@statewalker/utils";
import { replaceDomContent } from "@statewalker/utils-dom";
import newSlotsUpdater from "./newSlotsUpdater.js";

export default function newElementUpdater({ element, template, ...params }) {

  if (!template) return newSlotsUpdater(element);

  const trackUpdates = newUpdatesTracker()
    .enter((service) => {
      const fragment = template.cloneNode(true);
      const updateSlots = newSlotsUpdater(fragment);
      updateSlots([service]);
      return [...fragment.children];
    })
    .exit((nodes) => {
      nodes.forEach(
        (node) =>
          node.parentElement && node.parentElement.removeChild(node)
      );
    });
  return (list) => {
    const nodes = trackUpdates(list);
    const content = [];
    for (let node of nodes) {
      if (!node) continue;
      (Array.isArray(node) ? content.push(...node) : content.push(node))
    }
    replaceDomContent(element, ...content);
  };
}