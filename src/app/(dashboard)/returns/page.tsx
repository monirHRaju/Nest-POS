"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  SalesReturn,
  useGetReturnsQuery,
  useDeleteReturnMutation,
} from "@/store/api/returnsApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  PENDING: "badge-ghost",
  COMPLETED: "badge-success",
  CANCELED: "badge-error",
};

export default function ReturnsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetReturnsQuery({ page, pageSize, search });
  const [deleteReturn, { isLoading: isDeleting }] = useDeleteReturnMutation();

  const columns: ColumnDef<SalesReturn>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono">{getValue() as string}</span> },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy") },
    { id: "sale", header: "Sale Ref", cell: ({ row }) => <span className="font-mono text-sm">{row.original.sale?.referenceNo || "—"}</span> },
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
      accessorKey: "reason",
      header: "Reason",
      cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) || "—"}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => router.push(`/returns/${row.original.id}`)} className="btn btn-xs btn-ghost">👁</button>
          <button onClick={() => setDeleteId(row.original.id)} className="btn btn-xs btn-ghost text-error">🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Returns"
        count={data?.total}
        countLabel="returns"
        onAdd={() => router.push("/returns/add")}
        addLabel="Add Return"
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
        exportFilename="returns"
        searchPlaceholder="Search reference, sale, customer..."
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Return"
        message="Are you sure? Stock changes will be reversed if completed."
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteReturn(deleteId).unwrap();
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
