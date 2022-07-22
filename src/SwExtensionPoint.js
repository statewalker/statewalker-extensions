import { default as ns } from "@statewalker/ns";
import newUpdatesTracker from "./newUpdatesTracker.js";
import newSlotsUpdater from "./newSlotsUpdater.js";
import replaceDomContent from "./replaceDomContent.js";

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

  static initialize() {
    customElements.define("sw-extension-point", SwExtensionPoint);
  }


  static get observedAttributes() {
    return ["name"];
  }

  constructor() {
    super();
    this._template = this._findTemplate();
  }

  _findTemplate() {
    let template;
    for (let child = this.firstChild; child; child = child.nextSibling) {
      if (child.tagName === "TEMPLATE") {
        template = child;
        break;
      }
    }
    return template;
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

  _useContentDuplication(params) {
    const template = this._template;
    const trackUpdates = newUpdatesTracker((service) => {
      if (typeof service === "function") {
        service = service({ ...params, element: this });
      }
      const fragment = template.content.cloneNode(true);
      const updateSlots = newSlotsUpdater(fragment);
      updateSlots([service]);
      return [...fragment.children];
    }, (elements) => {
      elements.forEach(child => child.parentElement && child.parentElement.removeChild(child));
    });
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
    const update = this._template
      ? this._useContentDuplication(params)
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