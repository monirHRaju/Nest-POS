"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Quotation,
  useGetQuotationsQuery,
  useDeleteQuotationMutation,
  useConvertQuotationMutation,
} from "@/store/api/quotationsApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  SENT: "badge-info",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
  CONVERTED: "badge-primary",
  EXPIRED: "badge-warning",
};

export default function QuotationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [convertId, setConvertId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetQuotationsQuery({ page, pageSize, search });
  const [deleteQuotation, { isLoading: isDeleting }] = useDeleteQuotationMutation();
  const [convertQuotation, { isLoading: isConverting }] = useConvertQuotationMutation();

  const columns: ColumnDef<Quotation>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span> },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy") },
    {
      accessorKey: "expiryDate",
      header: "Expires",
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        if (!v) return "—";
        const expired = new Date(v) < new Date();
        return <span className={expired ? "text-error" : ""}>{format(new Date(v), "dd-MM-yyyy")}</span>;
      },
    },
    { id: "customer", header: "Customer", cell: ({ row }) => row.original.customer?.name || "—" },
    {
      accessorKey: "grandTotal",
      header: "Total",
      cell: ({ getValue }) => <span className="font-mono">৳{Number(getValue()).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className={`badge badge-sm ${statusColor[v]}`}>{v}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => router.push(`/quotations/${row.original.id}`)} className="btn btn-xs btn-ghost">👁</button>
          <button onClick={() => router.push(`/quotations/edit/${row.original.id}`)}
            className="btn btn-xs btn-ghost" disabled={row.original.status === "CONVERTED"}>✎</button>
          {row.original.status !== "CONVERTED" && (
            <button onClick={() => setConvertId(row.original.id)} className="btn btn-xs btn-success">→ Sale</button>
          )}
          <button onClick={() => setDeleteId(row.original.id)}
            className="btn btn-xs btn-ghost text-error" disabled={row.original.status === "CONVERTED"}>🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Quotations"
        count={data?.total}
        countLabel="quotes"
        onAdd={() => router.push("/quotations/add")}
        addLabel="Add Quotation"
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
        exportFilename="quotations"
        searchPlaceholder="Search reference or customer..."
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Quotation"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteQuotation(deleteId).unwrap();
            toast.success("Deleted");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        isDangerous
        loading={isDeleting}
      />
      <ConfirmDialog
        open={!!convertId}
        title="Convert to Sale"
        message="Create a sale from this quotation? Stock will be decreased."
        onConfirm={async () => {
          if (!convertId) return;
          try {
            const res = await convertQuotation(convertId).unwrap();
            toast.success("Converted to sale");
            router.push(`/sales/${res.saleId}`);
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setConvertId(null);
        }}
        onCancel={() => setConvertId(null)}
        loading={isConverting}
      />
    </>
  );
}
