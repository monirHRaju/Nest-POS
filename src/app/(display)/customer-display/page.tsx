"use client";

import { useEffect, useRef, useState } from "react";
import { CUSTOMER_DISPLAY_CHANNEL, DisplayCartPayload } from "@/lib/hooks/useCustomerDisplaySync";

interface ActivePromo {
  id: string;
  name: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minimumAmount: number;
  endDate: string;
}

const IDLE_TIMEOUT_MS = 20_000;
const CAROUSEL_INTERVAL_MS = 6000;

export default function CustomerDisplayPage() {
  const [cart, setCart] = useState<DisplayCartPayload | null>(null);
  const [promos, setPromos] = useState<ActivePromo[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load active promos
  useEffect(() => {
    fetch("/api/v1/customer-display/promos")
      .then((r) => r.json())
      .then((d) => setPromos(d.data ?? []))
      .catch(() => setPromos([]));
    const refresh = setInterval(() => {
      fetch("/api/v1/customer-display/promos")
        .then((r) => r.json())
        .then((d) => setPromos(d.data ?? []))
        .catch(() => {});
    }, 5 * 60_000);
    return () => clearInterval(refresh);
  }, []);

  // BroadcastChannel subscription (same-origin)
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
    bc.onmessage = (ev) => setCart(ev.data as DisplayCartPayload);
    return () => bc.close();
  }, []);

  // SSE fallback (cross-device)
  useEffect(() => {
    const es = new EventSource("/api/v1/customer-display/stream");
    es.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "cart") setCart(msg.payload as DisplayCartPayload);
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      // browser will retry automatically
    };
    return () => es.close();
  }, []);

  // Idle detection → toggle carousel
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const isEmpty = !cart || cart.items.length === 0;
    if (isEmpty) {
      idleTimerRef.current = setTimeout(() => setShowCarousel(true), IDLE_TIMEOUT_MS);
    } else {
      setShowCarousel(false);
    }
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [cart]);

  // Show carousel immediately if no cart received within initial idle window
  useEffect(() => {
    const t = setTimeout(() => {
      if (!cart || cart.items.length === 0) setShowCarousel(true);
    }, IDLE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  // Carousel rotation
  useEffect(() => {
    if (!showCarousel || promos.length === 0) return;
    const t = setInterval(() => {
      setCarouselIdx((i) => (i + 1) % promos.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [showCarousel, promos.length]);

  const sym = cart?.currencySymbol ?? "৳";
  const fmt = (n: number) => `${sym}${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  // Carousel view
  if (showCarousel && (!cart || cart.items.length === 0)) {
    if (promos.length === 0) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
          <h1 className="text-7xl font-bold mb-6">{cart?.storeName ?? "Welcome"}</h1>
          <p className="text-3xl text-white/60">We'll be right with you</p>
        </div>
      );
    }
    const p = promos[carouselIdx];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12">
        <div className="text-center max-w-4xl">
          <p className="text-2xl uppercase tracking-widest text-yellow-400 mb-4">Today's Special</p>
          <h1 className="text-8xl font-bold mb-6">{p.name}</h1>
          <div className="text-9xl font-bold text-yellow-400 mb-6">
            {p.type === "PERCENTAGE" ? `${p.value.toFixed(0)}% OFF` : `${sym}${p.value.toFixed(2)} OFF`}
          </div>
          <p className="text-3xl text-white/80 mb-2">
            Use code: <span className="font-mono bg-white text-black px-4 py-2 rounded">{p.code}</span>
          </p>
          {p.minimumAmount > 0 && (
            <p className="text-xl text-white/60 mt-4">Min order: {sym}{p.minimumAmount.toFixed(2)}</p>
          )}
          <div className="flex gap-2 justify-center mt-12">
            {promos.map((_, i) => (
              <div key={i} className={`h-2 w-12 rounded ${i === carouselIdx ? "bg-yellow-400" : "bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cart view
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black/60 border-b border-white/10 p-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">{cart?.storeName ?? "Nest POS"}</h1>
        {cart?.customerName && (
          <p className="text-xl text-white/70">Customer: <span className="text-white">{cart.customerName}</span></p>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {!cart || cart.items.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-4xl text-white/40">Waiting for items…</p>
          </div>
        ) : (
          <table className="w-full text-2xl">
            <thead className="border-b border-white/20 text-white/60">
              <tr>
                <th className="text-left py-4">Item</th>
                <th className="text-right py-4 w-24">Qty</th>
                <th className="text-right py-4 w-40">Price</th>
                <th className="text-right py-4 w-40">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((it) => (
                <tr key={it.productId} className="border-b border-white/5">
                  <td className="py-4">
                    <div className="font-semibold">{it.productName}</div>
                    <div className="text-base text-white/40 font-mono">{it.productCode}</div>
                  </td>
                  <td className="text-right font-mono">{it.quantity}</td>
                  <td className="text-right font-mono">{fmt(it.unitPrice)}</td>
                  <td className="text-right font-mono">{fmt(it.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {cart && cart.items.length > 0 && (
        <footer className="bg-white/5 border-t border-white/10 p-8">
          <div className="space-y-2 text-2xl">
            <div className="flex justify-between text-white/70">
              <span>Subtotal</span>
              <span className="font-mono">{fmt(cart.subtotal)}</span>
            </div>
            {cart.tax > 0 && (
              <div className="flex justify-between text-white/70">
                <span>Tax</span>
                <span className="font-mono">{fmt(cart.tax)}</span>
              </div>
            )}
            {cart.discount > 0 && (
              <div className="flex justify-between text-yellow-400">
                <span>Discount</span>
                <span className="font-mono">-{fmt(cart.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-white/20 text-5xl font-bold">
              <span>TOTAL</span>
              <span className="font-mono text-yellow-400">{fmt(cart.grandTotal)}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
