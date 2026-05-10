// In-memory pub/sub for customer display sync.
// Single-instance only (no Redis). For multi-instance prod, swap to Redis pub/sub.

import { EventEmitter } from "events";

type Bus = EventEmitter & { _initialized?: boolean };

declare global {
  // eslint-disable-next-line no-var
  var __cartBus: Bus | undefined;
}

function getBus(): Bus {
  if (!globalThis.__cartBus) {
    const e = new EventEmitter() as Bus;
    e.setMaxListeners(0); // unlimited subscribers across SSE clients
    globalThis.__cartBus = e;
  }
  return globalThis.__cartBus!;
}

export function publishCart(tenantId: string, payload: unknown): void {
  getBus().emit(`cart:${tenantId}`, payload);
}

export function subscribeCart(tenantId: string, handler: (payload: unknown) => void): () => void {
  const bus = getBus();
  const event = `cart:${tenantId}`;
  bus.on(event, handler);
  return () => bus.off(event, handler);
}
