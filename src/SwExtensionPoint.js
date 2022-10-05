import newServiceBinder from "./newServiceBinder.js";

export default class SwExtensionPoint extends HTMLElement {

  static initialize({ name = "sw-extension-point", adapters = [] } = {}) {
    SwExtensionPoint.adapters = adapters;
    customElements.define(name, this);
  }

  static get observedAttributes() {
    return ["name"];
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

  async _connect() {
    const serviceName = this.getAttribute("name");
    const template = this._getTemplate();
    this.cleanup = newServiceBinder({
      serviceName,
      element: this,
      template,
      adapters : SwExtensionPoint.adapters
    });
  }

  async _disconnect() {
    if (this.cleanup) this.cleanup();
    delete this.cleanup;
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