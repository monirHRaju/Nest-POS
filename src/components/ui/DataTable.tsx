"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import Papa from "papaparse";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  exportFilename?: string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  loading = false,
  exportFilename = "export",
  searchPlaceholder = "Search...",
  toolbar,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    onSearch?.(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleExportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const start = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-base-200">
        <div className="flex items-center gap-2 flex-1 min-w-64 max-w-md">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="input input-bordered w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-xs btn-circle btn-ghost"
              >✕</button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {toolbar}
          <button
            onClick={handleExportCSV}
            className="btn btn-outline btn-sm gap-1"
            disabled={loading || data.length === 0}
          >
            <span>📥</span> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-base-200/50 border-b border-base-300">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-xs font-semibold uppercase tracking-wider text-base-content/70 py-3"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-primary" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-base-content/50">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl opacity-30">📭</span>
                    <span>No data found</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-base-200/40 transition-colors border-b border-base-200 last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-base-200">
        <div className="text-sm text-base-content/60">
          {data.length === 0 ? "No results" : (
            <>Showing <span className="font-medium text-base-content">{start}</span>–<span className="font-medium text-base-content">{end}</span> of <span className="font-medium text-base-content">{total}</span></>
          )}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="select select-bordered select-sm"
            disabled={loading}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>

          <div className="join">
            <button
              onClick={() => onPageChange(1)}
              disabled={loading || page === 1}
              className="join-item btn btn-sm btn-ghost"
              title="First"
            >«</button>
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={loading || page === 1}
              className="join-item btn btn-sm btn-ghost"
            >‹</button>
            <button className="join-item btn btn-sm btn-ghost no-animation pointer-events-none">
              {page} / {totalPages}
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={loading || page >= totalPages}
              className="join-item btn btn-sm btn-ghost"
            >›</button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={loading || page >= totalPages}
              className="join-item btn btn-sm btn-ghost"
              title="Last"
            >»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
