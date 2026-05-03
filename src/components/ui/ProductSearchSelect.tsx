"use client";

import { useState, useEffect, useRef } from "react";
import { useGetProductsQuery, Product } from "@/store/api/productsApi";

interface Props {
  onSelect: (product: Product) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductSearchSelect({ onSelect, placeholder = "Scan barcode or search product...", disabled }: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useGetProductsQuery(
    { search, pageSize: 10 },
    { skip: !search || search.length < 1 }
  );

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (p: Product) => {
    onSelect(p);
    setSearch("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && data?.data?.length) {
      // Auto-pick first match (barcode flow)
      e.preventDefault();
      handlePick(data.data[0]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {open && search.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-base-100 shadow-lg rounded-box border border-base-300 max-h-72 overflow-auto">
          {isFetching && <div className="p-3 text-sm text-base-content/60">Searching...</div>}
          {!isFetching && (!data?.data || data.data.length === 0) && (
            <div className="p-3 text-sm text-base-content/60">No products found</div>
          )}
          {data?.data?.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePick(p)}
              className="w-full text-left px-3 py-2 hover:bg-base-200 border-b border-base-200 last:border-0 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-base-content/60">
                  {p.code} • Stock: {p.totalStock ?? 0}
                </div>
              </div>
              <div className="text-sm font-mono">{Number(p.costPrice).toFixed(2)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
