"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Sale,
  useGetSalesQuery,
  useDeleteSaleMutation,
  useUpdateSaleMutation,
} from "@/store/api/salesApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

const paymentColor: Record<string, string> = {
  UNPAID: "badge-error",
  PARTIAL: "badge-warning",
  PAID: "badge-success",
};

const sourceColor: Record<string, string> = {
  POS: "badge-primary",
  WEB: "badge-info",
  API: "badge-ghost",
};

export default function SalesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetSalesQuery({ page, pageSize, search });
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation();
  const [updateSale] = useUpdateSaleMutation();

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span> },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy HH:mm"),
    },
    { id: "customer", header: "Customer", cell: ({ row }) => row.original.customer?.name || "—" },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouse?.name || "—" },
    {
      id: "cashier",
      header: "Cashier",
      cell: ({ row }) => row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : "—",
    },
    {
      accessorKey: "grandTotal",
      header: "Total",
      cell: ({ getValue }) => <span className="font-mono">৳{Number(getValue()).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className={`badge badge-sm ${sourceColor[v]}`}>{v}</span>;
      },
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
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <span className={`badge badge-sm ${paymentColor[v]}`}>{v}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => router.push(`/sales/${row.original.id}`)} className="btn btn-xs btn-ghost">👁</button>
          {row.original.status === "COMPLETED" && (
            <button
              onClick={async () => {
                if (!confirm("Cancel this sale? Stock will be restored.")) return;
                try {
                  await updateSale({ id: row.original.id, data: { status: "CANCELED" } }).unwrap();
                  toast.success("Canceled");
                } catch (e: any) { toast.error(e.data?.error || "Error"); }
              }}
              className="btn btn-xs btn-warning"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
            className="btn btn-xs btn-ghost text-error"
            disabled={row.original.status === "COMPLETED"}
          >🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sales"
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.push("/pos")} className="btn btn-primary">⚡ Open POS</button>
            <button onClick={() => router.push("/sales/add")} className="btn btn-outline">+ Add Sale</button>
          </div>
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
        exportFilename="sales"
        searchPlaceholder="Search reference or customer..."
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Sale"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteSale(deleteId).unwrap();
            toast.success("Deleted");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setShowDeleteConfirm(false); setDeleteId(null);
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
