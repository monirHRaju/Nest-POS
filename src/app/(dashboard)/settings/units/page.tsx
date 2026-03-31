"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UnitModal } from "@/components/modals/UnitModal";
import {
  Unit,
  UnitInput,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
} from "@/store/api/unitsApi";
import toast from "react-hot-toast";

export default function UnitsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));
  const [pageSize, setPageSize] = useState(Number(searchParams.get("pageSize") ?? 10));
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const [showModal, setShowModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Queries and mutations
  const { data, isLoading, isFetching } = useGetUnitsQuery({
    page,
    pageSize,
    search,
  });

  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation();
  const [deleteUnit, { isLoading: isDeleting }] = useDeleteUnitMutation();

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedUnit(null);
    setShowModal(true);
  };

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowModal(true);
  };

  const handleDelete = (unit: Unit) => {
    setDeleteId(unit.id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (data: UnitInput) => {
    try {
      if (selectedUnit) {
        await updateUnit({ id: selectedUnit.id, data }).unwrap();
        toast.success("Unit updated successfully");
      } else {
        await createUnit(data).unwrap();
        toast.success("Unit created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save unit");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteUnit(deleteId).unwrap();
      toast.success("Unit deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete unit");
    }
  };

  const columns: ColumnDef<Unit>[] = [
    {
      accessorKey: "name",
      header: "Unit Name",
    },
    {
      accessorKey: "shortName",
      header: "Short Name",
      cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code>,
    },
    {
      accessorKey: "baseUnit",
      header: "Base Unit",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      id: "conversion",
      header: "Conversion",
      cell: ({ row }) => {
        const { baseUnit, operator, operationValue } = row.original;
        if (!baseUnit || !operator || !operationValue) return "—";
        return `${operator} ${operationValue}`;
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
      <PageHeader title="Units" onAdd={handleAdd} />

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
        exportFilename="units"
        searchPlaceholder="Search units..."
      />

      <UnitModal
        open={showModal}
        unit={selectedUnit}
        onClose={() => {
          setShowModal(false);
          setSelectedUnit(null);
        }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
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
