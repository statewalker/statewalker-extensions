import { services } from "@statewalker/services";
import { newUpdatesTracker } from "@statewalker/utils";
import { replaceDomContent } from "@statewalker/utils-dom";
import newSlotsUpdater from "./newSlotsUpdater.js";

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
      this._template = null;
      if (this.hasAttribute("template")) {
        const selector = this.getAttribute("template") || "template";
        const template = this.querySelector(selector);
        this._template =
          (template ? template.content || template : null) || null;
        if (!this._template) {
          this._template = document.createDocumentFragment();
          while (this.firstChild) {
            this._template.appendChild(this.firstChild);
          }
        }
      }
    }
    return this._template;
  }

  _useSlotsUpdates(params) {
    const trackUpdates = newUpdatesTracker()
      .enter((service) => {
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
    const trackUpdates = newUpdatesTracker()
      .enter((service) => {
        const fragment = template.cloneNode(true);
        if (typeof service === "function") {
          service = service({ ...params, element: fragment });
        }
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
      replaceDomContent(this, ...content);
    };
  }

  async _connect() {
    const serviceName = this.getAttribute("name");
    const params = { serviceName };
    const template = this._getTemplate();
    const update = template
      ? this._useContentDuplication(template, params)
      : this._useSlotsUpdates(params);
    this.consumer = services.newConsumer(serviceName, update);
  }

  async _disconnect() {
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