import ns from "./ns.js"

export default class SwExtensionPoint extends HTMLElement {
    

    static get observedAttributes() {
      return ["name"];
    }
  
    constructor() {
      super();
    }
  
    _connect() {
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
      this.consumer = ns.services.newConsumer(serviceName, (list) => {
        list = check(list);
        updateSlots(list);
      });
    }
  
    _disconnect() {
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
        this._disconnect();
        this._connect();
      }
    }
  }