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
    ustomElements.define("sw-extension-point", SwExtensionPoint);
  }


  static get observedAttributes() {
    return ["name"];
  }

  constructor() {
    super();
    this._spread = this.hasAttribute('spread');
  }

  _useSlotsUpdates() {
    const trackUpdates = newUpdatesTracker((service) => {
      if (typeof service === "function") {
        service = service({
          element: this,
          serviceName
        });
      }
      return service;
    });
    const updateSlots = newSlotsUpdater(this);
    return (list) => {
      list = trackUpdates(list);
      updateSlots(list);
    };
  }

  _useContentDuplication() {
    if (!this._template) {
      this._template = document.createElement("template");
      const children = [];
      for (let child = this.firstChild; child; child = child.nextSibling) {
        children.push(child);
      }
      children.forEach(child => this._template.content.appendChild(child));
    }
    const trackUpdates = newUpdatesTracker((service) => {
      if (typeof service === "function") {
        service = service({
          element: this,
          serviceName
        });
      }
      const element = this._template.content.cloneNode(true);
      const updateSlots = newSlotsUpdater(element);
      updateSlots([service]);
      return element;
    }, ((element) => element.parentElement && element.parentElement.removeChild(this)));
    return (list) => {
      const elements = trackUpdates(list);
      replaceDomContent(this, elements);
    };
  }

  async _connect() {
    await preloadServices();
    const serviceName = this.getAttribute("name");
    const update = this._spread ? this._useContentDuplication() : this._useSlotsUpdates();
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