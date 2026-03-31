"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
}

export function FormField({
  label,
  error,
  required = false,
  children,
  helperText,
}: FormFieldProps) {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          className: `${
            (children as React.ReactElement).props.className || "input input-bordered"
          } ${error ? "input-error" : ""}`,
        })}
      </div>

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}

      {helperText && !error && (
        <label className="label">
          <span className="label-text-alt text-base-content/60">{helperText}</span>
        </label>
      )}
    </div>
  );
}
