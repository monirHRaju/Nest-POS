"use client";

import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-base-content/80 mb-6">{message}</p>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-outline" disabled={loading}>
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={`btn ${isDangerous ? "btn-error" : "btn-primary"}`}
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
