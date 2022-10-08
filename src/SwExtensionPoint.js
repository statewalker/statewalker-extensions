import { services } from "@statewalker/services";
import { newUpdatesTracker } from "@statewalker/utils";
import { replaceDomContent, toDomNode } from "@statewalker/utils-dom";

export default class SwExtensionPoint extends HTMLElement {
  static initialize({
    name = "sw-extension-point",
    bind = ({ serviceName, element, ...params }) => {
      const trackUpdates = newUpdatesTracker().enter((service) => {
        if (typeof service === "function") {
          service = service({ ...params, serviceName, element });
        }
        return service;
      });
      return (list) => {
        const nodes = trackUpdates(list);
        const content = [];
        for (let node of nodes) {
          if (!node) continue;
          Array.isArray(node) ? content.push(...node) : content.push(node);
        }
        if (!content.length) content.push(null);
        replaceDomContent(element, ...content.map((v) => toDomNode(v)));
      };
    }
  } = {}) {
    SwExtensionPoint.bind = bind;
    customElements.define(name, this);
  }

  connectedCallback() {
    const serviceName = this.getAttribute("name");
    const update = SwExtensionPoint.bind({ serviceName, element: this });
    this._consumer = services.newConsumer(serviceName, update);
  }
  disconnectedCallback() {
    if (this._consumer) this._consumer.close();
    delete this._consumer;
  }
}