import { default as ns } from "@statewalker/ns";
import newUpdatesTracker from "./newUpdatesTracker.js";
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
    

    static get observedAttributes() {
      return ["name"];
    }
  
    constructor() {
      super();
    }

  
    async _connect() {
      const serviceName = this.getAttribute("name");
  
      const params = {};
      const check = newUpdatesTracker((service) => {
        if (typeof service === "function") {
          service = service({
            ...params,
            element: this,
            serviceName
          });
        }
        return service;
      });
      const updateSlots = newSlotsUpdater(this);
      await preloadServices();
      this.consumer = ns.services.newConsumer(serviceName, (list) => {
        list = check(list);
        updateSlots(list);
      });
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

  customElements.define("sw-extension-point", SwExtensionPoint);
