"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaxRateModal } from "@/components/modals/TaxRateModal";
import {
  TaxRate,
  TaxRateInput,
  useGetTaxRatesQuery,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useDeleteTaxRateMutation,
} from "@/store/api/taxRatesApi";
import toast from "react-hot-toast";

export default function TaxRatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize") ?? 10));
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const [showModal, setShowModal] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState<TaxRate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Queries and mutations
  const { data, isLoading, isFetching } = useGetTaxRatesQuery({
    page,
    pageSize,
    search,
  });

  const [createTaxRate, { isLoading: isCreating }] = useCreateTaxRateMutation();
  const [updateTaxRate, { isLoading: isUpdating }] = useUpdateTaxRateMutation();
  const [deleteTaxRate, { isLoading: isDeleting }] = useDeleteTaxRateMutation();

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedTaxRate(null);
    setShowModal(true);
  };

  const handleEdit = (taxRate: TaxRate) => {
    setSelectedTaxRate(taxRate);
    setShowModal(true);
  };

  const handleDelete = (taxRate: TaxRate) => {
    setDeleteId(taxRate.id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (data: TaxRateInput) => {
    try {
      if (selectedTaxRate) {
        await updateTaxRate({ id: selectedTaxRate.id, data }).unwrap();
        toast.success("Tax rate updated successfully");
      } else {
        await createTaxRate(data).unwrap();
        toast.success("Tax rate created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save tax rate");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteTaxRate(deleteId).unwrap();
      toast.success("Tax rate deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete tax rate");
    }
  };

  const columns: ColumnDef<TaxRate>[] = [
    {
      accessorKey: "name",
      header: "Tax Rate Name",
    },
    {
      id: "rateDisplay",
      header: "Rate",
      cell: ({ row }) => {
        const { rate, type } = row.original;
        return `${rate}${type === "PERCENTAGE" ? "%" : ""}`;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => {
        const type = getValue() as string;
        return (
          <div className="badge badge-sm">
            {type === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
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
      <PageHeader title="Tax Rates" onAdd={handleAdd} />

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
        exportFilename="tax-rates"
        searchPlaceholder="Search tax rates..."
      />

      <TaxRateModal
        open={showModal}
        taxRate={selectedTaxRate}
        onClose={() => {
          setShowModal(false);
          setSelectedTaxRate(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Tax Rate"
        message="Are you sure you want to delete this tax rate? This action cannot be undone."
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
