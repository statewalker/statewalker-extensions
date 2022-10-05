import { services } from "@statewalker/services";
import newElementUpdater from "./newElementUpdater.js"

export default function newServiceBinder({ element, template, serviceName, adapters = [], ...params }) {
  const domUpdate = newElementUpdater({ element, template, serviceName, ...params });

  const updaters = adapters.map(adapter => adapter({
    element, template, serviceName, ...params
  })).concat([domUpdate]);

  // const trackUpdates = newUpdatesTracker()
  //   .enter((service) => {
  //     if (typeof service === "function") {
  //       service = service({ ...params, serviceName, element, template });
  //     }
  //     return service;
  //   })
  return services.newConsumer(serviceName, (list) => {
    // list = trackUpdates(list);
    for (let updater of updaters) {
      if (updater(list)) break;
    }
  }).close;
}