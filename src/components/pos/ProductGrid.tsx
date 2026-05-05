"use client";

import { useState } from "react";
import { useGetProductsQuery, Product } from "@/store/api/productsApi";
import { useGetCategoriesQuery } from "@/store/api/categoriesApi";
import { useGetBrandsQuery } from "@/store/api/brandsApi";

interface Props {
  onSelect: (p: Product) => void;
  warehouseId?: string | null;
}

export function ProductGrid({ onSelect, warehouseId }: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const { data: catData } = useGetCategoriesQuery({ pageSize: 50 });
  const { data: brandData } = useGetBrandsQuery({ pageSize: 50 });
  const { data, isFetching } = useGetProductsQuery({
    page,
    pageSize,
    search,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    warehouseId: warehouseId || undefined,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-base-300">
        <input
          data-barcode-target="true"
          type="text"
          className="input input-bordered w-full"
          placeholder="🔍 Search product or scan barcode..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Category tabs */}
      <div className="px-3 py-2 border-b border-base-300 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => { setCategoryId(""); setBrandId(""); setPage(1); }}
          className={`btn btn-xs ${!categoryId && !brandId ? "btn-primary" : "btn-ghost"} mr-1`}
        >
          All
        </button>
        {catData?.data?.map((c: any) => (
          <button
            key={c.id}
            onClick={() => { setCategoryId(c.id); setPage(1); }}
            className={`btn btn-xs ${categoryId === c.id ? "btn-primary" : "btn-ghost"} mr-1`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Brand chips */}
      {brandData?.data && brandData.data.length > 0 && (
        <div className="px-3 py-1 border-b border-base-300 overflow-x-auto whitespace-nowrap text-xs">
          <span className="opacity-60 mr-2">Brand:</span>
          <button
            onClick={() => { setBrandId(""); setPage(1); }}
            className={`badge badge-sm cursor-pointer mr-1 ${!brandId ? "badge-primary" : "badge-ghost"}`}
          >
            Any
          </button>
          {brandData.data.map((b: any) => (
            <button
              key={b.id}
              onClick={() => { setBrandId(b.id); setPage(1); }}
              className={`badge badge-sm cursor-pointer mr-1 ${brandId === b.id ? "badge-primary" : "badge-ghost"}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto p-3">
        {isFetching && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-md" />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {data?.data?.map((p) => {
            const stock = p.totalStock ?? 0;
            const outOfStock = stock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                disabled={outOfStock}
                className={`card bg-base-100 shadow hover:shadow-lg transition-shadow text-left p-2 ${outOfStock ? "opacity-40" : ""}`}
              >
                <div className="aspect-square bg-base-200 rounded flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-3xl opacity-30">📦</span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-medium line-clamp-2 leading-tight">{p.name}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-primary">৳{Number(p.sellingPrice).toFixed(0)}</span>
                    <span className={`text-xs ${outOfStock ? "text-error" : "text-base-content/60"}`}>{stock}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {data && data.total > pageSize && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-ghost">←</button>
            <span className="btn btn-sm btn-ghost no-animation">{page} / {Math.ceil(data.total / pageSize)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= data.total} className="btn btn-sm btn-ghost">→</button>
          </div>
        )}
      </div>
    </div>
  );
}
