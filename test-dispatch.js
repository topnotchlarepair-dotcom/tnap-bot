import { dispatchEngine } from "./src/engine/telegram.dispatch.js";

await dispatchEngine.send({
  id: 9999,
  clientName: "Test User",
  phone: "323-555-4040",
  address: "1820 Sunset Blvd, Los Angeles, CA",
  appliance: "Refrigerator",
  brand: "LG",
  model: "LFXS28968S",
  serial: "802TRAJZZ",
  description: "Not cooling (TEST MODE)",
  visitDate: "Today",
  timeWindow: "1pm–4pm",
  technician: "Unassigned",
  status: "Pending"
}, -1003362682354);

process.exit(0);

