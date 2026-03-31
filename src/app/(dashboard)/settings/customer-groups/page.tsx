"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CustomerGroupModal } from "@/components/modals/CustomerGroupModal";
import {
  CustomerGroup,
  GroupInput,
  useGetCustomerGroupsQuery,
  useCreateCustomerGroupMutation,
  useUpdateCustomerGroupMutation,
  useDeleteCustomerGroupMutation,
} from "@/store/api/customerGroupsApi";
import toast from "react-hot-toast";

export default function CustomerGroupsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<CustomerGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetCustomerGroupsQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateCustomerGroupMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCustomerGroupMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCustomerGroupMutation();

  const columns: ColumnDef<CustomerGroup>[] = [
    { accessorKey: "name", header: "Group Name" },
    { accessorKey: "discountPercent", header: "Default Discount", cell: ({ getValue }) => `${getValue()}%` },
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
        title="Customer Groups"
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
        exportFilename="customer-groups"
        searchPlaceholder="Search groups..."
      />
      <CustomerGroupModal
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
        title="Delete Group"
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
