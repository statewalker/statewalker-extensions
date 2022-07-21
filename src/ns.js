import { default as ns } from "@statewalker/ns";
// import "@statewalker/services";
if (!ns.services) {
  (async () => {
    const { services } = await import("https://unpkg.com/@statewalker/services/index.js?module")
    // const { services } = await import("@statewalker/services")
    if (!ns.services) ns.services = services;
  })();
}
export default ns;