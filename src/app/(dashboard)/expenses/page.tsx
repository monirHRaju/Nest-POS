"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import {
  Expense,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/store/api/expensesApi";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetExpensesQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [update, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const totalAmount = (data?.data || []).reduce((sum, e) => sum + Number(e.amount), 0);

  const columns: ColumnDef<Expense>[] = [
    { accessorKey: "referenceNo", header: "Reference", cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => format(new Date(getValue() as string), "dd-MM-yyyy"),
    },
    { id: "category", header: "Category", cell: ({ row }) => <span className="badge badge-ghost">{row.original.category?.name || "—"}</span> },
    { id: "warehouse", header: "Warehouse", cell: ({ row }) => row.original.warehouse?.name || "—" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => <span className="font-mono font-semibold text-error">৳{Number(getValue()).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>,
    },
    { accessorKey: "note", header: "Note", cell: ({ getValue }) => <span className="text-sm text-base-content/70">{(getValue() as string) || "—"}</span> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-xs btn-ghost">✎</button>
          <button onClick={() => setDeleteId(row.original.id)} className="btn btn-xs btn-ghost text-error">🗑</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`Page total: ৳${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        count={data?.total}
        countLabel="entries"
        onAdd={() => { setSelected(null); setShowModal(true); }}
        addLabel="Add Expense"
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
        exportFilename="expenses"
        searchPlaceholder="Search reference or note..."
      />
      <ExpenseModal
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
        open={!!deleteId}
        title="Delete Expense"
        message="Are you sure?"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteItem(deleteId).unwrap();
            toast.success("Deleted");
          } catch (e: any) { toast.error(e.data?.error || "Error"); }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
