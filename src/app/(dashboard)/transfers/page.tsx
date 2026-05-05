"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Transfer,
  useGetTransfersQuery,
  useDeleteTransferMutation,
  useUpdateTransferStatusMutation,
} from "@/store/api/transfersApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  SENT: "badge-info",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

export default function TransfersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetTransfersQuery({ page, pageSize, search });
  const [deleteTransfer, { isLoading: isDeleting }] = useDeleteTransferMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTransferStatusMutation();

  const columns: ColumnDef<Transfer>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span> },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy") },
    { id: "from", header: "From", cell: ({ row }) => row.original.fromWarehouse?.name || "—" },
    { id: "to", header: "To", cell: ({ row }) => row.original.toWarehouse?.name || "—" },
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
          <button onClick={() => router.push(`/transfers/${row.original.id}`)} className="btn btn-xs btn-ghost">👁</button>
          {row.original.status !== "COMPLETED" && row.original.status !== "CANCELED" && (
            <button onClick={() => setCompleteId(row.original.id)} className="btn btn-xs btn-success">✓ Complete</button>
          )}
          <button onClick={() => setDeleteId(row.original.id)}
            className="btn btn-xs btn-ghost text-error"
            disabled={row.original.status === "COMPLETED"}>🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Transfers"
        count={data?.total}
        countLabel="transfers"
        onAdd={() => router.push("/transfers/add")}
        addLabel="Add Transfer"
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
        exportFilename="transfers"
        searchPlaceholder="Search reference..."
      />
      <ConfirmDialog
        open={!!completeId}
        title="Complete Transfer"
        message="Mark as completed? Stock will move from source to destination warehouse."
        onConfirm={async () => {
          if (!completeId) return;
          try {
            await updateStatus({ id: completeId, status: "COMPLETED" }).unwrap();
            toast.success("Stock transferred");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setCompleteId(null);
        }}
        onCancel={() => setCompleteId(null)}
        loading={isUpdating}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Transfer"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteTransfer(deleteId).unwrap();
            toast.success("Deleted");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
