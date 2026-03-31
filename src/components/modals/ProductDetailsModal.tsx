"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Product } from "@/store/api/productsApi";

interface Props {
  open: boolean;
  product: Product;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  DIGITAL: "Digital",
  SERVICE: "Service",
  COMBO: "Combo",
};

export function ProductDetailsModal({ open, product, onClose }: Props) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!open || !barcodeRef.current || !product.code) return;

    const renderBarcode = async () => {
      try {
        const JsBarcode = (await import("jsbarcode")).default;
        JsBarcode(barcodeRef.current, product.code, {
          format: product.barcodeSymbology === "QR" ? "CODE128" : product.barcodeSymbology,
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 8,
        });
      } catch {
        // jsbarcode not installed or invalid symbology — skip silently
      }
    };

    renderBarcode();
  }, [open, product.code, product.barcodeSymbology]);

  const totalStock =
    product.totalStock ??
    (product.warehouseStocks?.reduce((s, w) => s + Number(w.quantity), 0) ?? 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Product Details"
      size="xl"
      footer={
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Link
              href={`/products/edit/${product.id}`}
              className="btn btn-primary btn-sm"
              onClick={onClose}
            >
              Edit Product
            </Link>
            <Link
              href={`/products/print-labels?productId=${product.id}`}
              className="btn btn-outline btn-sm"
              onClick={onClose}
            >
              Print Label
            </Link>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Close
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Image + Barcode */}
        <div className="flex flex-col items-center gap-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-48 h-48 rounded-lg object-cover border border-base-200"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-base-200 flex items-center justify-center text-base-content/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className="flex flex-col items-center gap-1">
            <p className="text-xl font-bold">{product.name}</p>
            <p className="text-sm text-base-content/60 font-mono">{product.code}</p>
            <div className="flex gap-2 mt-1">
              <span className="badge badge-outline">{TYPE_LABELS[product.type] || product.type}</span>
              <span className={`badge ${product.isActive ? "badge-success" : "badge-error"}`}>
                {product.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Barcode */}
          <div className="border border-base-200 rounded p-2 bg-white">
            <svg ref={barcodeRef}></svg>
          </div>
        </div>

        {/* Right: Info + Stock */}
        <div className="space-y-4">
          <table className="table table-sm w-full">
            <tbody>
              <tr>
                <td className="font-medium text-base-content/60 w-32">Brand</td>
                <td>{product.brand?.name || "—"}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Category</td>
                <td>{product.category?.name || "—"}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Unit</td>
                <td>{product.unit?.name || "—"}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Tax</td>
                <td>{product.tax ? `${product.tax.name} (${product.tax.rate}%)` : "—"}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Cost Price</td>
                <td>{Number(product.costPrice).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Sale Price</td>
                <td>{Number(product.sellingPrice).toFixed(2)}</td>
              </tr>
              {product.wholesalePrice != null && (
                <tr>
                  <td className="font-medium text-base-content/60">Wholesale</td>
                  <td>{Number(product.wholesalePrice).toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td className="font-medium text-base-content/60">Alert Qty</td>
                <td>{Number(product.alertQuantity).toFixed(0)}</td>
              </tr>
              <tr>
                <td className="font-medium text-base-content/60">Barcode</td>
                <td className="font-mono text-sm">{product.barcodeSymbology}</td>
              </tr>
            </tbody>
          </table>

          {/* Warehouse Stock */}
          {product.warehouseStocks && product.warehouseStocks.length > 0 && (
            <div>
              <p className="font-medium mb-2">Stock by Warehouse</p>
              <div className="overflow-x-auto">
                <table className="table table-sm border border-base-200 rounded-lg">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Warehouse</th>
                      <th className="text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.warehouseStocks.map((ws) => (
                      <tr key={ws.warehouseId}>
                        <td>{ws.warehouse?.name ?? ws.warehouseId}</td>
                        <td className="text-right">
                          <span className={`badge ${Number(ws.quantity) <= Number(product.alertQuantity) ? "badge-warning" : "badge-ghost"}`}>
                            {Number(ws.quantity).toFixed(0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t border-base-200">
                      <td>Total</td>
                      <td className="text-right">{Number(totalStock).toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
