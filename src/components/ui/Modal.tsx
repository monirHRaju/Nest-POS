"use client";

import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const sizeClasses = {
    sm: "w-96",
    md: "w-full max-w-2xl",
    lg: "w-full max-w-4xl",
    xl: "w-full max-w-5xl",
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`} open={open}>
      <div className={`modal-box ${sizeClasses[size]}`}>
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>

        <h3 className="font-bold text-lg mb-4">{title}</h3>

        <div className="py-4">{children}</div>

        {footer && <div className="modal-action">{footer}</div>}
      </div>

      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
