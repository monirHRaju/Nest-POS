"use client";

import { ReactNode } from "react";
import { Column, exportCsv, exportPdf } from "@/lib/utils/export";
import { DateRangeFilter, RangeValue } from "./DateRangeFilter";

interface Props {
  title: string;
  subtitle?: string;
  range?: RangeValue;
  onRangeChange?: (val: RangeValue) => void;
  columns?: Column[];
  rows?: Record<string, unknown>[];
  exportFilename?: string;
  extraFilters?: ReactNode;
  children: ReactNode;
}

export function ReportShell({
  title,
  subtitle,
  range,
  onRangeChange,
  columns,
  rows,
  exportFilename,
  extraFilters,
  children,
}: Props) {
  const canExport = columns && rows && exportFilename;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
        </div>
        {canExport && (
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline"
              onClick={() => exportCsv(exportFilename!, columns!, rows!)}
              disabled={!rows!.length}
            >
              CSV
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() =>
                exportPdf(exportFilename!, columns!, rows!, {
                  title,
                  subtitle: range ? `${range.from} → ${range.to}` : undefined,
                  orientation: columns!.length > 6 ? "landscape" : "portrait",
                })
              }
              disabled={!rows!.length}
            >
              PDF
            </button>
          </div>
        )}
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-4">
          <div className="flex flex-wrap items-end gap-3">
            {range && onRangeChange && <DateRangeFilter value={range} onChange={onRangeChange} />}
            {extraFilters}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
