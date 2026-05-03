"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserModal } from "@/components/modals/UserModal";
import {
  AppUser,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/store/api/usersApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetUsersQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateUserMutation();
  const [update, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteUserMutation();

  const roleColor: Record<string, string> = {
    OWNER: "badge-primary",
    ADMIN: "badge-secondary",
    MANAGER: "badge-info",
    USER: "badge-ghost",
  };

  const columns: ColumnDef<AppUser>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => {
        const r = getValue() as string;
        return <span className={`badge badge-sm ${roleColor[r]}`}>{r}</span>;
      },
    },
    {
      id: "group",
      header: "Group",
      cell: ({ row }) => row.original.group?.name || "—",
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => row.original.warehouse?.name || "—",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => (getValue() ? <span className="badge badge-success badge-sm">Active</span> : <span className="badge badge-ghost badge-sm">Inactive</span>),
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v ? format(new Date(v), "dd-MM-yyyy HH:mm") : "—";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-sm btn-ghost">✎ Edit</button>
          <button onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }} className="btn btn-sm btn-ghost text-error">🗑️ Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Users" onAdd={() => { setSelected(null); setShowModal(true); }} />
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
        exportFilename="users"
        searchPlaceholder="Search users..."
      />
      <UserModal
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
        title="Delete User"
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
