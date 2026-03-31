"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useImportProductsMutation } from "@/store/api/productsApi";
import toast from "react-hot-toast";

const CSV_HEADERS = ["Name", "Code", "Type", "Category", "Brand", "Unit", "Cost Price", "Selling Price", "Alert Qty", "Description"];
const CSV_TYPES = ["STANDARD", "DIGITAL", "SERVICE", "COMBO"];

function downloadTemplate() {
  const rows = [
    CSV_HEADERS.join(","),
    `"Organic Tomatoes","TOM-001","STANDARD","Vegetables","Organic Farms","KG","5.00","8.50","10","Fresh organic tomatoes"`,
    `"Basmati Rice","RICE-001","STANDARD","Grains","","BAG","45.00","65.00","5",""`,
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface ParsedRow {
  [key: string]: string;
}

export default function ImportProductsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importProducts, { isLoading }] = useImportProductsMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const text = await file.text();
    const Papa = (await import("papaparse")).default;
    const result = Papa.parse<ParsedRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    setParsedRows(result.data);
  };

  const mapRow = (row: ParsedRow) => ({
    name: row["Name"] || row["name"] || "",
    code: row["Code"] || row["code"] || "",
    type: (row["Type"] || row["type"] || "STANDARD").toUpperCase(),
    category: row["Category"] || row["category"] || "",
    brand: row["Brand"] || row["brand"] || "",
    unit: row["Unit"] || row["unit"] || "",
    costPrice: parseFloat(row["Cost Price"] || row["costPrice"] || "0") || 0,
    sellingPrice: parseFloat(row["Selling Price"] || row["sellingPrice"] || "0") || 0,
    alertQuantity: parseFloat(row["Alert Qty"] || row["alertQuantity"] || "0") || 0,
    description: row["Description"] || row["description"] || "",
  });

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      toast.error("No rows to import");
      return;
    }

    try {
      const result = await importProducts({ rows: parsedRows.map(mapRow) }).unwrap();
      setImportResult(result);
      if (result.imported > 0) {
        toast.success(`${result.imported} products imported`);
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Import failed");
    }
  };

  const previewRows = parsedRows.slice(0, 5);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Import Products</h1>
      </div>

      <div className="space-y-4 max-w-4xl">
        {/* Instructions */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Instructions</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Download the CSV template below</li>
              <li>Fill in your product data (Name and Code are required)</li>
              <li>Upload the filled CSV file</li>
              <li>Review the preview and click Import</li>
            </ol>
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Required columns: <span className="text-error">Name</span>, <span className="text-error">Code</span></p>
              <p className="text-sm font-medium mb-1">Type values: {CSV_TYPES.join(", ")}</p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="btn btn-outline btn-sm mt-2"
              >
                Download CSV Template
              </button>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-base">Upload File</h2>
            <div
              className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {fileName ? (
                  <p className="font-medium">{fileName} <span className="text-base-content/60">({parsedRows.length} rows)</span></p>
                ) : (
                  <p className="text-base-content/60">Click to select a CSV file</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {parsedRows.length > 0 && (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">
                Preview
                <span className="text-sm font-normal text-base-content/60">
                  (showing first {Math.min(5, parsedRows.length)} of {parsedRows.length} rows)
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-base-200">
                      {Object.keys(previewRows[0] || {}).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, vi) => (
                          <td key={vi} className="max-w-32 truncate">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setParsedRows([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                  className="btn btn-outline btn-sm"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading loading-spinner loading-xs"></span>}
                  Import {parsedRows.length} Products
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {importResult && (
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-base">Import Result</h2>
              <div className="flex gap-4">
                <div className="stat p-0">
                  <div className="stat-title text-sm">Imported</div>
                  <div className="stat-value text-success text-2xl">{importResult.imported}</div>
                </div>
                <div className="stat p-0">
                  <div className="stat-title text-sm">Skipped</div>
                  <div className="stat-value text-warning text-2xl">{importResult.skipped}</div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2">Errors ({importResult.errors.length}):</p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-sm text-error">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {importResult.imported > 0 && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => router.push("/products")}
                    className="btn btn-primary btn-sm"
                  >
                    View Products
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
