"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WarehouseModal } from "@/components/modals/WarehouseModal";
import {
  Warehouse,
  WarehouseInput,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useDeleteWarehouseMutation,
} from "@/store/api/warehousesApi";
import toast from "react-hot-toast";

export default function WarehousesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetWarehousesQuery({
    page,
    pageSize,
    search,
  });

  const [create, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [update, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteWarehouseMutation();

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };

  const handleAdd = () => {
    setSelected(null);
    setShowModal(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelected(warehouse);
    setShowModal(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    setDeleteId(warehouse.id);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = async (data: WarehouseInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data }).unwrap();
        toast.success("Warehouse updated successfully");
      } else {
        await create(data).unwrap();
        toast.success("Warehouse created successfully");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save warehouse");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteItem(deleteId).unwrap();
      toast.success("Warehouse deleted successfully");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete warehouse");
    }
  };

  const columns: ColumnDef<Warehouse>[] = [
    {
      accessorKey: "name",
      header: "Warehouse Name",
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ getValue }) =>
        getValue() ? <span className="badge badge-success">Default</span> : "—",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) =>
        getValue() ? <span className="badge badge-info">Active</span> : <span className="badge">Inactive</span>,
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
            disabled={row.original.isDefault}
            className="btn btn-sm btn-ghost text-error disabled:opacity-50"
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Warehouses" onAdd={handleAdd} />

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
        exportFilename="warehouses"
        searchPlaceholder="Search warehouses..."
      />

      <WarehouseModal
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
        title="Delete Warehouse"
        message="Are you sure you want to delete this warehouse? This action cannot be undone."
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
