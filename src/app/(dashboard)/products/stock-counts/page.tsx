"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StockCount, useGetStockCountsQuery } from "@/store/api/stockCountsApi";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-warning",
  IN_PROGRESS: "badge-info",
  COMPLETED: "badge-success",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function StockCountsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useGetStockCountsQuery({ page, pageSize, search });

  const columns: ColumnDef<StockCount>[] = [
    {
      accessorKey: "referenceNo",
      header: "Reference No",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouse?.name || "—",
    },
    {
      id: "items",
      header: "Products",
      cell: ({ row }) => (
        <span className="badge badge-ghost">{row.original._count?.items ?? 0}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <span className={`badge ${STATUS_BADGE[status] || "badge-ghost"}`}>
            {STATUS_LABEL[status] || status}
          </span>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Note",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/products/stock-counts/${row.original.id}`} className="btn btn-sm btn-ghost">
          {row.original.status === "COMPLETED" ? "View" : "Enter Counts"}
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock Counts"
        subtitle="Physical inventory verification and reconciliation"
        actions={
          <Link href="/products/stock-counts/add" className="btn btn-primary btn-sm">
            + New Count
          </Link>
        }
      />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        loading={isLoading || isFetching}
        exportFilename="stock-counts"
        searchPlaceholder="Search by reference..."
      />
    </>
  );
}
