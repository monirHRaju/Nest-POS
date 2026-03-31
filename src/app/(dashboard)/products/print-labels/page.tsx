"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGetProductsQuery, useGetProductQuery, Product } from "@/store/api/productsApi";

interface LabelItem {
  product: Product;
  quantity: number;
}

interface LabelOptions {
  showSiteName: boolean;
  showProductName: boolean;
  showPrice: boolean;
  showUnit: boolean;
  showCategory: boolean;
  showBarcode: boolean;
}

function BarcodeLabel({ product, options }: { product: Product; options: LabelOptions }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !product.code) return;

    const renderBarcode = async () => {
      try {
        const JsBarcode = (await import("jsbarcode")).default;
        JsBarcode(svgRef.current, product.code, {
          format: product.barcodeSymbology === "QR" ? "CODE128" : product.barcodeSymbology,
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 10,
          margin: 4,
        });
      } catch {
        // ignore
      }
    };

    renderBarcode();
  }, [product.code, product.barcodeSymbology]);

  return (
    <div className="label-item border border-gray-300 p-2 rounded text-xs flex flex-col items-center gap-1 w-full">
      {options.showSiteName && (
        <p className="font-semibold text-center truncate w-full">Organic Agriculture Ltd</p>
      )}
      {options.showProductName && (
        <p className="text-center font-medium truncate w-full">{product.name}</p>
      )}
      {options.showCategory && product.category && (
        <p className="text-center text-gray-500 truncate w-full">{product.category.name}</p>
      )}
      {options.showPrice && (
        <p className="text-center font-bold">{Number(product.sellingPrice).toFixed(2)}</p>
      )}
      {options.showUnit && product.unit && (
        <p className="text-center text-gray-500">per {product.unit.shortName}</p>
      )}
      {options.showBarcode && (
        <svg ref={svgRef} className="w-full"></svg>
      )}
    </div>
  );
}

function PrintLabelsContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("productId");

  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [options, setOptions] = useState<LabelOptions>({
    showSiteName: true,
    showProductName: true,
    showPrice: true,
    showUnit: true,
    showCategory: false,
    showBarcode: true,
  });
  const [paperSize, setPaperSize] = useState("A4");

  const { data: productsData } = useGetProductsQuery(
    { search: productSearch, pageSize: 10 },
    { skip: productSearch.length < 2 }
  );

  const { data: preselectedProduct } = useGetProductQuery(preselectedId!, {
    skip: !preselectedId,
  });

  useEffect(() => {
    if (preselectedProduct && labelItems.length === 0) {
      setLabelItems([{ product: preselectedProduct, quantity: 1 }]);
    }
  }, [preselectedProduct]);

  const addProduct = (product: Product) => {
    if (labelItems.some((i) => i.product.id === product.id)) {
      setLabelItems((prev) =>
        prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      );
    } else {
      setLabelItems((prev) => [...prev, { product, quantity: 1 }]);
    }
    setProductSearch("");
  };

  const updateQty = (idx: number, qty: number) => {
    setLabelItems((prev) => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const removeItem = (idx: number) => {
    setLabelItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleOption = (key: keyof LabelOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Expand items by quantity
  const expandedLabels = labelItems.flatMap((item) =>
    Array(item.quantity).fill(item.product)
  );

  const handlePrint = () => window.print();

  return (
    <div className="print:hidden-controls">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-grid { display: grid !important; gap: 4px; }
          body { margin: 0; }
        }
      `}</style>

      <div className="no-print">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => window.history.back()} className="btn btn-ghost btn-sm">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Print Barcode Labels</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Settings */}
          <div className="space-y-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-base">Paper Size</h2>
                <select
                  className="select select-bordered w-full"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="4x6">4×6 Label</option>
                  <option value="2x1">2×1 Label</option>
                </select>
              </div>
            </div>

            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-base">Label Content</h2>
                {(Object.entries(options) as [keyof LabelOptions, boolean][]).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer py-1">
                    <span className="text-sm capitalize">{key.replace("show", "").replace(/([A-Z])/g, " $1").trim()}</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-sm toggle-primary"
                      checked={value}
                      onChange={() => toggleOption(key)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Product Search + List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-base">Add Products</h2>
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {productSearch.length >= 2 && productsData?.data && productsData.data.length > 0 && (
                    <ul className="absolute z-50 mt-1 w-full bg-base-100 border border-base-200 rounded-box shadow-lg max-h-60 overflow-y-auto">
                      {productsData.data.map((p) => (
                        <li key={p.id}>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-base-200 flex justify-between"
                            onClick={() => addProduct(p)}
                          >
                            <span>{p.name}</span>
                            <span className="text-base-content/60 font-mono text-sm">{p.code}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {labelItems.length > 0 && (
                  <table className="table table-sm mt-4">
                    <thead>
                      <tr className="bg-base-200">
                        <th>Product</th>
                        <th>Code</th>
                        <th className="w-24">Copies</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {labelItems.map((item, idx) => (
                        <tr key={item.product.id}>
                          <td>{item.product.name}</td>
                          <td className="font-mono text-sm">{item.product.code}</td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="input input-bordered input-sm w-20"
                              value={item.quantity}
                              onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-xs text-error" onClick={() => removeItem(idx)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {labelItems.length > 0 && (
              <button onClick={handlePrint} className="btn btn-primary w-full">
                Print {expandedLabels.length} Labels
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview */}
      {expandedLabels.length > 0 && (
        <div>
          <div className="no-print">
            <h2 className="text-lg font-semibold mb-3">Preview ({expandedLabels.length} labels)</h2>
          </div>
          <div
            className="print-grid"
            style={{
              display: "grid",
              gridTemplateColumns: paperSize === "2x1" ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
              gap: "8px",
              padding: "8px",
            }}
          >
            {expandedLabels.map((product, idx) => (
              <BarcodeLabel key={idx} product={product} options={options} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrintLabelsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg"></span></div>}>
      <PrintLabelsContent />
    </Suspense>
  );
}
