"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PermissionGroupModal } from "@/components/modals/PermissionGroupModal";
import {
  PermissionGroup,
  PermissionGroupInput,
  useGetPermissionGroupsQuery,
  useCreatePermissionGroupMutation,
  useUpdatePermissionGroupMutation,
  useDeletePermissionGroupMutation,
} from "@/store/api/permissionsApi";
import toast from "react-hot-toast";

export default function PermissionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<PermissionGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetPermissionGroupsQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreatePermissionGroupMutation();
  const [update, { isLoading: isUpdating }] = useUpdatePermissionGroupMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeletePermissionGroupMutation();

  const handleSubmit = async (data: PermissionGroupInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data }).unwrap();
        toast.success("Permission group updated");
      } else {
        await create(data).unwrap();
        toast.success("Permission group created");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save");
    }
  };

  // Count active permissions per group
  const countActivePerms = (permissions: Record<string, boolean>) =>
    Object.values(permissions).filter(Boolean).length;

  const columns: ColumnDef<PermissionGroup>[] = [
    {
      accessorKey: "name",
      header: "Group Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ getValue }) => {
        const count = countActivePerms(getValue() as Record<string, boolean>);
        return (
          <span className={`badge ${count > 0 ? "badge-primary" : "badge-ghost"}`}>
            {count} active
          </span>
        );
      },
    },
    {
      id: "users",
      header: "Assigned Users",
      cell: ({ row }) => {
        const count = row.original._count?.users ?? 0;
        return count > 0 ? (
          <span className="badge badge-info">{count} user{count !== 1 ? "s" : ""}</span>
        ) : (
          "—"
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
            disabled={(row.original._count?.users ?? 0) > 0}
            className="btn btn-sm btn-ghost text-error disabled:opacity-50"
            title={(row.original._count?.users ?? 0) > 0 ? "Reassign users before deleting" : ""}
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
        title="Permission Groups"
        subtitle="Define role-based permission sets and assign them to users"
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
        exportFilename="permission-groups"
        searchPlaceholder="Search groups..."
      />

      <PermissionGroupModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Permission Group"
        message="Are you sure? This cannot be undone. Users assigned to this group will lose their permissions."
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteItem(deleteId).unwrap();
            toast.success("Permission group deleted");
            setShowDeleteConfirm(false);
            setDeleteId(null);
          } catch (err: any) {
            toast.error(err.data?.error || "Failed to delete");
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
