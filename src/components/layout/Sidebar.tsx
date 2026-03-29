"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/uiSlice";
import { menuItems, type MenuItem } from "./sidebar-menu";

function SidebarItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => child.href === pathname);
  });

  const isActive = item.href === pathname;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-base-content/10 transition-colors ${
            open ? "bg-base-content/5" : ""
          }`}
        >
          <span className="flex items-center gap-3">
            {item.icon && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
            )}
            <span>{item.label}</span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        {open && (
          <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-base-content/10 pl-2">
            {item.children!.map((child) => (
              <SidebarItem key={child.label} item={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href || "#"}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-primary text-primary-content font-medium"
            : "hover:bg-base-content/10"
        }`}
      >
        {item.icon && depth === 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={item.icon}
            />
          </svg>
        )}
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-base-100 border-r border-base-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-base-300">
          <Link href="/" className="text-xl font-bold text-primary">
            Nest-POS
          </Link>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="btn btn-ghost btn-sm btn-square lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
