"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Purchase,
  useGetPurchasesQuery,
  useDeletePurchaseMutation,
  useReceivePurchaseMutation,
} from "@/store/api/purchasesApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  ORDERED: "badge-info",
  RECEIVED: "badge-success",
  CANCELED: "badge-error",
};

const paymentColor: Record<string, string> = {
  UNPAID: "badge-error",
  PARTIAL: "badge-warning",
  PAID: "badge-success",
};

export default function PurchasesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [showReceiveConfirm, setShowReceiveConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetPurchasesQuery({ page, pageSize, search });
  const [deletePurchase, { isLoading: isDeleting }] = useDeletePurchaseMutation();
  const [receivePurchase, { isLoading: isReceiving }] = useReceivePurchaseMutation();

  const columns: ColumnDef<Purchase>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span> },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy"),
    },
    { id: "supplier", header: "Supplier", cell: ({ row }) => row.original.supplier?.name || "—" },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouse?.name || "—" },
    {
      accessorKey: "grandTotal",
      header: "Grand Total",
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
          <button onClick={() => router.push(`/purchases/${row.original.id}`)} className="btn btn-xs btn-ghost">👁</button>
          <button onClick={() => router.push(`/purchases/edit/${row.original.id}`)}
            className="btn btn-xs btn-ghost"
            disabled={row.original.status === "RECEIVED" || row.original.status === "CANCELED"}>✎</button>
          {row.original.status !== "RECEIVED" && row.original.status !== "CANCELED" && (
            <button onClick={() => { setReceiveId(row.original.id); setShowReceiveConfirm(true); }}
              className="btn btn-xs btn-success">📦 Receive</button>
          )}
          <button onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
            className="btn btn-xs btn-ghost text-error"
            disabled={row.original.status === "RECEIVED"}>🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Purchases"
        actions={
          <button onClick={() => router.push("/purchases/add")} className="btn btn-primary">+ Add Purchase</button>
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
        exportFilename="purchases"
        searchPlaceholder="Search by reference or supplier..."
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Purchase"
        message="Are you sure? This cannot be undone."
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deletePurchase(deleteId).unwrap();
            toast.success("Deleted");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setShowDeleteConfirm(false); setDeleteId(null);
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        isDangerous
        loading={isDeleting}
      />
      <ConfirmDialog
        open={showReceiveConfirm}
        title="Receive Purchase"
        message="Mark as received? Stock will be increased."
        onConfirm={async () => {
          if (!receiveId) return;
          try {
            await receivePurchase(receiveId).unwrap();
            toast.success("Received — stock updated");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setShowReceiveConfirm(false); setReceiveId(null);
        }}
        onCancel={() => { setShowReceiveConfirm(false); setReceiveId(null); }}
        loading={isReceiving}
      />
    </>
  );
}
