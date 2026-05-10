"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PromoModal } from "@/components/modals/PromoModal";
import {
  Promo,
  PromoInput,
  useGetPromosQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeletePromoMutation,
} from "@/store/api/promosApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function PromosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Promo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetPromosQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreatePromoMutation();
  const [update, { isLoading: isUpdating }] = useUpdatePromoMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeletePromoMutation();

  const handleSubmit = async (input: PromoInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data: input }).unwrap();
        toast.success("Promo updated");
      } else {
        await create(input).unwrap();
        toast.success("Promo created");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem(deleteId).unwrap();
      toast.success("Promo deleted");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete");
    }
  };

  const columns: ColumnDef<Promo>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "code", header: "Code", cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code> },
    {
      accessorKey: "value",
      header: "Discount",
      cell: ({ row }) => row.original.type === "PERCENTAGE"
        ? `${Number(row.original.value).toFixed(0)}%`
        : `৳${Number(row.original.value).toFixed(2)}`,
    },
    {
      accessorKey: "minimumAmount",
      header: "Min Amount",
      cell: ({ getValue }) => `৳${Number(getValue()).toFixed(2)}`,
    },
    {
      accessorKey: "startDate",
      header: "Start",
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy"),
    },
    {
      accessorKey: "endDate",
      header: "End",
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy"),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const now = new Date();
        const start = new Date(row.original.startDate);
        const end = new Date(row.original.endDate);
        if (!row.original.isActive) return <span className="badge">Inactive</span>;
        if (now < start) return <span className="badge badge-warning">Scheduled</span>;
        if (now > end) return <span className="badge badge-error">Expired</span>;
        return <span className="badge badge-success">Live</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-sm btn-ghost">✎ Edit</button>
          <button onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }} className="btn btn-sm btn-ghost text-error">🗑️ Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Promos" onAdd={() => { setSelected(null); setShowModal(true); }} />

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
        exportFilename="promos"
        searchPlaceholder="Search promos..."
      />

      <PromoModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Promo"
        message="Remove this promo? Existing sales using it are unaffected."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
