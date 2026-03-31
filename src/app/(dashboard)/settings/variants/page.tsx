"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VariantModal } from "@/components/modals/VariantModal";
import {
  Variant,
  VariantInput,
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} from "@/store/api/variantsApi";
import toast from "react-hot-toast";

export default function VariantsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Variant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetVariantsQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateVariantMutation();
  const [update, { isLoading: isUpdating }] = useUpdateVariantMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteVariantMutation();

  const handleSubmit = async (data: VariantInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data }).unwrap();
        toast.success("Variant updated successfully");
      } else {
        await create(data).unwrap();
        toast.success("Variant created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save variant");
    }
  };

  const columns: ColumnDef<Variant>[] = [
    {
      accessorKey: "name",
      header: "Variant Name",
    },
    {
      accessorKey: "values",
      header: "Values",
      cell: ({ getValue }) => {
        const values = getValue() as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {values.map((v) => (
              <span key={v} className="badge badge-outline badge-sm">
                {v}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setSelected(row.original); setShowModal(true); }}
            className="btn btn-sm btn-ghost"
          >
            ✎ Edit
          </button>
          <button
            onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
            className="btn btn-sm btn-ghost text-error"
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Variants"
        subtitle="Manage product attribute types (Size, Color, etc.) and their values"
        onAdd={() => { setSelected(null); setShowModal(true); }}
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
        exportFilename="variants"
        searchPlaceholder="Search variants..."
      />

      <VariantModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Variant"
        message="Are you sure? Products using this variant type will lose their variant assignments."
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteItem(deleteId).unwrap();
            toast.success("Variant deleted successfully");
            setShowDeleteConfirm(false);
            setDeleteId(null);
          } catch (err: any) {
            toast.error(err.data?.error || "Failed to delete variant");
          }
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        confirmText="Delete"
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
