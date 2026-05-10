"use client";

import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Column {
  header: string;
  key: string;
  align?: "left" | "right" | "center";
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

function valueFor(col: Column, row: Record<string, unknown>): string {
  const raw = row[col.key];
  if (col.format) return col.format(raw, row);
  if (raw == null) return "";
  return String(raw);
}

export function exportCsv(filename: string, columns: Column[], rows: Record<string, unknown>[]) {
  const data = rows.map((r) => {
    const out: Record<string, string> = {};
    for (const c of columns) out[c.header] = valueFor(c, r);
    return out;
  });
  const csv = Papa.unparse(data, { quotes: true });
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
}

export function exportPdf(
  filename: string,
  columns: Column[],
  rows: Record<string, unknown>[],
  options: PdfOptions
) {
  const doc = new jsPDF({ orientation: options.orientation ?? "portrait", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text(options.title, 40, 40);
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(options.subtitle, 40, 58);
    doc.setTextColor(0);
  }

  const head = [columns.map((c) => c.header)];
  const body = rows.map((r) => columns.map((c) => valueFor(c, r)));

  autoTable(doc, {
    head,
    body,
    startY: options.subtitle ? 72 : 56,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: columns.reduce<Record<number, { halign: "left" | "right" | "center" }>>((acc, c, idx) => {
      if (c.align) acc[idx] = { halign: c.align };
      return acc;
    }, {}),
  });

  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
