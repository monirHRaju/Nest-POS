"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PrinterModal } from "@/components/modals/PrinterModal";
import {
  Printer,
  PrinterInput,
  useGetPrintersQuery,
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
  useDeletePrinterMutation,
} from "@/store/api/printersApi";
import { buildTestPrint, printOnce } from "@/lib/hardware/escpos";
import toast from "react-hot-toast";

export default function PrintersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Printer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useGetPrintersQuery({ page, pageSize, search });
  const [create, { isLoading: isCreating }] = useCreatePrinterMutation();
  const [update, { isLoading: isUpdating }] = useUpdatePrinterMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeletePrinterMutation();

  const handleSubmit = async (input: PrinterInput) => {
    try {
      if (selected) {
        await update({ id: selected.id, data: input }).unwrap();
        toast.success("Printer updated");
      } else {
        await create(input).unwrap();
        toast.success("Printer created");
      }
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to save");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem(deleteId).unwrap();
      toast.success("Printer deleted");
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.data?.error || "Failed to delete");
    }
  };

  const handleTestPrint = async (printer: Printer) => {
    if (printer.connectionType !== "BROWSER" && printer.connectionType !== "USB") {
      toast.error(`Test print only supported for BROWSER/USB. Connection: ${printer.connectionType}`);
      return;
    }
    setPrintingId(printer.id);
    try {
      const buf = buildTestPrint(printer.characterWidth);
      await printOnce(buf);
      toast.success("Test print sent");
    } catch (err: any) {
      toast.error(err.message || "Print failed");
    } finally {
      setPrintingId(null);
    }
  };

  const columns: ColumnDef<Printer>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "connectionType", header: "Connection" },
    {
      accessorKey: "ipAddress",
      header: "IP / Port",
      cell: ({ row }) => row.original.ipAddress
        ? `${row.original.ipAddress}${row.original.port ? `:${row.original.port}` : ""}`
        : "—",
    },
    { accessorKey: "characterWidth", header: "Width" },
    {
      accessorKey: "isDefault",
      header: "Default",
      cell: ({ getValue }) => getValue() ? <span className="badge badge-success">Default</span> : "—",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => getValue() ? <span className="badge badge-info">Active</span> : <span className="badge">Inactive</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <button onClick={() => handleTestPrint(row.original)} className="btn btn-sm btn-ghost"
            disabled={printingId === row.original.id}>
            {printingId === row.original.id ? "..." : "🖨 Test"}
          </button>
          <button onClick={() => { setSelected(row.original); setShowModal(true); }} className="btn btn-sm btn-ghost">✎ Edit</button>
          <button onClick={() => { setDeleteId(row.original.id); setShowDeleteConfirm(true); }} className="btn btn-sm btn-ghost text-error">🗑️ Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Printers" onAdd={() => { setSelected(null); setShowModal(true); }} />

      <div className="alert alert-info mb-4">
        <span className="text-sm">
          Use <strong>BROWSER</strong> or <strong>USB</strong> connection for WebUSB thermal printers.
          Click <strong>Test</strong> to verify hardware. Browser will prompt you to select the USB device.
        </span>
      </div>

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
        exportFilename="printers"
        searchPlaceholder="Search printers..."
      />

      <PrinterModal
        open={showModal}
        item={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSubmit={handleSubmit}
        loading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Printer"
        message="Remove this printer config? This will not affect physical hardware."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        loading={isDeleting}
      />
    </>
  );
}
