"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryModal } from "@/components/modals/CategoryModal";
import {
  Category,
  CategoryInput,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/store/api/categoriesApi";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetCategoriesQuery({
    page,
    pageSize,
    search,
  });

  const [create, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleAdd = () => {
    setSelected(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelected(category);
    setShowModal(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteId(category.id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (data: CategoryInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await create(data).unwrap();
        toast.success("Category created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save category");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteItem(deleteId).unwrap();
      toast.success("Category deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete category");
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Category Name",
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code>,
    },
    {
      accessorKey: "parent",
      header: "Parent Category",
      cell: ({ getValue }) => {
        const parent = getValue() as any;
        return parent?.name || "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="btn btn-sm btn-ghost"
          >
            ✎ Edit
          </button>
          <button
            onClick={() => handleDelete(row.original)}
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
      <PageHeader title="Categories" onAdd={handleAdd} />

      <DataTable
        data={data?.data ?? []}
        columns={columns}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={handleSearch}
        loading={isLoading || isFetching}
        exportFilename="categories"
        searchPlaceholder="Search categories..."
      />

      <CategoryModal
        open={showModal}
        item={selected}
        onClose={() => {
          setShowModal(false);
          setSelected(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone if it has child categories or products."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
