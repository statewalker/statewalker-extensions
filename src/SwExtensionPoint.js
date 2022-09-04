import { default as ns } from "@statewalker/ns";
import { replaceDomContent } from "@statewalker/utils-dom";
import { newUpdatesTracker } from "@statewalker/utils";
import newSlotsUpdater from "./newSlotsUpdater.js";

async function preloadServices() {
  const s = preloadServices;
  if (!s._promise) {
    let promise = Promise.resolve();
    if (!ns.services) {
      promise = promise.then(() => import("https://unpkg.com/@statewalker/services/index.js?module"))
    }
    s._promise = promise.then(() => ns.services);
  }
  return s._promise;
}

export default class SwExtensionPoint extends HTMLElement {
  static initialize(name = "sw-extension-point") {
    customElements.define(name, this);
  }

  static get observedAttributes() {
    return ["name"];
  }

  constructor() {
    super();
  }

  _getTemplate() {
    if (this._template === undefined) {
      const selector = this.getAttribute("template") || "template";
      const template = this.querySelector(selector);
      this._template =
        (template ? template.content || template : null) || null;
    }
    return this._template;
  }

  _useSlotsUpdates(params) {
    const trackUpdates = newUpdatesTracker((service) => {
      if (typeof service === "function") {
        service = service({ ...params, element: this });
      }
      return service;
    });
    const updateSlots = newSlotsUpdater(this);
    return (list) => {
      list = trackUpdates(list);
      updateSlots(list);
    };
  }

  _useContentDuplication(template, params) {
    const trackUpdates = newUpdatesTracker(
      (service) => {
        if (typeof service === "function") {
          service = service({ ...params, element: this });
        }
        const fragment = template.cloneNode(true);
        const updateSlots = newSlotsUpdater(fragment);
        updateSlots([service]);
        return [...fragment.children];
      },
      (elements) => {
        elements.forEach(
          (child) =>
            child.parentElement && child.parentElement.removeChild(child)
        );
      }
    );
    return (list) => {
      const elements = trackUpdates(list);
      const allNodes = [];
      for (let list of elements) {
        allNodes.push(...list);
      }
      replaceDomContent(this, ...allNodes);
    };
  }

  async _connect() {
    const serviceName = this.getAttribute("name");
    const params = { serviceName };
    const template = this._getTemplate();
    const update = template
      ? this._useContentDuplication(template, params)
      : this._useSlotsUpdates(params);
    await preloadServices();
    this.consumer = ns.services.newConsumer(serviceName, update);
  }

  async _disconnect() {
    await preloadServices();
    if (this.consumer) this.consumer.close();
    delete this.consumer;
  }

  connectedCallback() {
    this._connect();
  }
  disconnectedCallback() {
    this._disconnect();
  }
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      (async () => {
        await this._disconnect();
        await this._connect();
      })();
    }
  }
}