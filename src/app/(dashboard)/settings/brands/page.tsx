"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BrandModal } from "@/components/modals/BrandModal";
import {
  Brand,
  BrandInput,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "@/store/api/brandsApi";
import toast from "react-hot-toast";

export default function BrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize") ?? 10));
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const [showModal, setShowModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Queries and mutations
  const { data, isLoading, isFetching } = useGetBrandsQuery({
    page,
    pageSize,
    search,
  });

  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: isDeleting }] = useDeleteBrandMutation();

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedBrand(null);
    setShowModal(true);
  };

  const handleEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setShowModal(true);
  };

  const handleDelete = (brand: Brand) => {
    setDeleteId(brand.id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (data: BrandInput) => {
    try {
      if (selectedBrand) {
        await updateBrand({ id: selectedBrand.id, data }).unwrap();
        toast.success("Brand updated successfully");
      } else {
        await createBrand(data).unwrap();
        toast.success("Brand created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save brand");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteBrand(deleteId).unwrap();
      toast.success("Brand deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete brand");
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Brand Name",
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code>,
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
      <PageHeader title="Brands" onAdd={handleAdd} />

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
        exportFilename="brands"
        searchPlaceholder="Search brands..."
      />

      <BrandModal
        open={showModal}
        brand={selectedBrand}
        onClose={() => {
          setShowModal(false);
          setSelectedBrand(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone."
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
