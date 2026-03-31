"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CurrencyModal } from "@/components/modals/CurrencyModal";
import {
  Currency,
  CurrencyInput,
  useGetCurrenciesQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
} from "@/store/api/currenciesApi";
import toast from "react-hot-toast";

export default function CurrenciesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Currency | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, isFetching } = useGetCurrenciesQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateCurrencyMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCurrencyMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCurrencyMutation();

  const columns: ColumnDef<Currency>[] = [
    { accessorKey: "name", header: "Currency Name" },
    { accessorKey: "code", header: "Code", cell: ({ getValue }) => <code className="text-xs">{getValue() as string}</code> },
    { accessorKey: "symbol", header: "Symbol" },
    { accessorKey: "exchangeRate", header: "Exchange Rate", cell: ({ getValue }) => (getValue() as number).toFixed(4) },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ getValue }) => getValue() ? <span className="badge badge-success">Default</span> : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-sm btn-ghost">
            ✎ Edit
          </button>
          <button
            onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }}
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
      <PageHeader
        title="Currencies"
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
        exportFilename="currencies"
        searchPlaceholder="Search currencies..."
      />
      <CurrencyModal
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
        title="Delete Currency"
        message="Are you sure? This action cannot be undone."
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
