"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  required = false,
  children,
  helperText,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`form-control w-full ${className}`}>
      <label className="label py-1">
        <span className="label-text text-sm font-medium">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>

      <div className="relative">
        {React.cloneElement(children as React.ReactElement<any>, {
          className: `${
            (children as React.ReactElement<any>).props.className || "input input-bordered"
          } ${error ? "input-error border-error" : ""}`,
        })}
      </div>

      {error && (
        <label className="label py-1">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}

      {helperText && !error && (
        <label className="label py-1">
          <span className="label-text-alt text-base-content/60">{helperText}</span>
        </label>
      )}
    </div>
  );
}
