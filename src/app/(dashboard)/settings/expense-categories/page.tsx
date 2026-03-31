"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExpenseCategoryModal } from "@/components/modals/ExpenseCategoryModal";
import {
  ExpenseCategory,
  CategoryInput,
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
} from "@/store/api/expenseCategoriesApi";
import toast from "react-hot-toast";

export default function ExpenseCategoriesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ExpenseCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetExpenseCategoriesQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateExpenseCategoryMutation();
  const [update, { isLoading: isUpdating }] = useUpdateExpenseCategoryMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteExpenseCategoryMutation();

  const columns: ColumnDef<ExpenseCategory>[] = [
    { accessorKey: "name", header: "Category Name" },
    { accessorKey: "description", header: "Description", cell: ({ getValue }) => getValue() || "—" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-sm btn-ghost">
            ✎ Edit
          </button>
          <button onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }} className="btn btn-sm btn-ghost text-error">
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Expense Categories"
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
        exportFilename="expense-categories"
        searchPlaceholder="Search categories..."
      />
      <ExpenseCategoryModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={async (d) => {
          try {
            if (selected) {
              await update({ id: selected.id, data: d }).unwrap();
              toast.success("Updated");
            } else {
              await create(d).unwrap();
              toast.success("Created");
            }
          } catch (e: any) {
            toast.error(e.data?.error || "Error");
          }
        }}
        loading={isCreating || isUpdating}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Category"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteItem(deleteId).unwrap();
            toast.success("Deleted");
            setShowDeleteConfirm(false);
            setDeleteId(null);
          } catch (e: any) {
            toast.error(e.data?.error || "Error");
          }
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
