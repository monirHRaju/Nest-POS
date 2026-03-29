"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { href, label };
  });

  return (
    <div className="text-sm breadcrumbs px-0 py-2">
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={crumb.href}>
            {index === crumbs.length - 1 ? (
              <span className="text-base-content/70">{crumb.label}</span>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
