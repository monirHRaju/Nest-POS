"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CustomerModal } from "@/components/modals/CustomerModal";
import {
  Customer,
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/store/api/customersApi";
import toast from "react-hot-toast";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetCustomersQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.name}</span>
          {row.original.isWalkIn && <span className="badge badge-ghost badge-sm">Walk-in</span>}
        </div>
      ),
    },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => (getValue() as string) || "—" },
    { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => (getValue() as string) || "—" },
    {
      id: "group",
      header: "Group",
      cell: ({ row }) => row.original.customerGroup?.name || "—",
    },
    {
      accessorKey: "rewardPoints",
      header: "Points",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => (getValue() ? <span className="badge badge-success badge-sm">Active</span> : <span className="badge badge-ghost badge-sm">Inactive</span>),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setSelected(row.original); setShowModal(true); }}
            className="btn btn-sm btn-ghost"
            disabled={row.original.isWalkIn}
          >
            ✎ Edit
          </button>
          <button
            onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
            className="btn btn-sm btn-ghost text-error"
            disabled={row.original.isWalkIn}
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Customers" onAdd={() => { setSelected(null); setShowModal(true); }} />
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
        exportFilename="customers"
        searchPlaceholder="Search customers..."
      />
      <CustomerModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={async (d) => {
          try {
            if (selected) await update({ id: selected.id, data: d }).unwrap();
            else await create(d).unwrap();
            toast.success(selected ? "Updated" : "Created");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
        }}
        loading={isCreating || isUpdating}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Customer"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteItem(deleteId).unwrap();
            toast.success("Deleted");
            setShowDeleteConfirm(false);
            setDeleteId(null);
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
        }}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
