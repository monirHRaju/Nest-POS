"use client";

import { useEffect, useRef } from "react";

/**
 * Detects barcode scanner input. HID scanners emit rapid keystrokes (<50ms apart) ending with Enter.
 * Calls onScan(code) when complete sequence detected.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options: { minLength?: number; maxIntervalMs?: number; enabled?: boolean } = {}
) {
  const { minLength = 4, maxIntervalMs = 50, enabled = true } = options;
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Skip if focused on input/textarea/select that's not the search bar
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const isContentEditable = target.isContentEditable;
      // Allow scan only when not in form input OR in our search input (which has data-barcode-target)
      if (isInput && !target.dataset.barcodeTarget) return;
      if (isContentEditable) return;

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          onScanRef.current(bufferRef.current);
          e.preventDefault();
        }
        bufferRef.current = "";
        return;
      }

      // Ignore modifier keys / function keys
      if (e.key.length !== 1) return;

      // Reset buffer if too slow
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      bufferRef.current += e.key;
      lastKeyTimeRef.current = now;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [minLength, maxIntervalMs, enabled]);
}
