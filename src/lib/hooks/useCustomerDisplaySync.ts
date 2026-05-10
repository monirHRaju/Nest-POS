"use client";

import { useEffect, useRef } from "react";

export interface DisplayCartPayload {
  items: Array<{
    productId: string;
    productName: string;
    productCode: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  customerName?: string | null;
  storeName?: string;
  currencySymbol?: string;
  updatedAt: number;
}

const CHANNEL = "nest-pos-customer-display";

export function useCustomerDisplaySync(payload: DisplayCartPayload | null) {
  const bcRef = useRef<BroadcastChannel | null>(null);
  const lastSyncRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    bcRef.current = new BroadcastChannel(CHANNEL);
    return () => {
      bcRef.current?.close();
      bcRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!payload) return;

    // Same-origin: BroadcastChannel — instant
    bcRef.current?.postMessage(payload);

    // Cross-device: SSE via POST, debounced 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const now = Date.now();
      if (now - lastSyncRef.current < 200) return;
      lastSyncRef.current = now;
      fetch("/api/v1/customer-display/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // network failure non-fatal — BroadcastChannel still works
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [payload]);
}

export const CUSTOMER_DISPLAY_CHANNEL = CHANNEL;
