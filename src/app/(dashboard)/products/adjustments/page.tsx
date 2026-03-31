"use client";

import { useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Adjustment, useGetAdjustmentsQuery } from "@/store/api/adjustmentsApi";

const TYPE_BADGE: Record<string, string> = {
  ADDITION: "badge-success",
  SUBTRACTION: "badge-error",
};

export default function AdjustmentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useGetAdjustmentsQuery({ page, pageSize, search });

  const columns: ColumnDef<Adjustment>[] = [
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
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => {
        const type = getValue() as string;
        return (
          <span className={`badge ${TYPE_BADGE[type] || "badge-ghost"}`}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </span>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="badge badge-ghost">{row.original._count?.items ?? 0}</span>
      ),
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
        <Link href={`/products/adjustments/${row.original.id}`} className="btn btn-sm btn-ghost">
          View
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock Adjustments"
        subtitle="Record stock additions and subtractions"
        actions={
          <Link href="/products/adjustments/add" className="btn btn-primary btn-sm">
            + New Adjustment
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
        exportFilename="adjustments"
        searchPlaceholder="Search by reference..."
      />
    </>
  );
}
