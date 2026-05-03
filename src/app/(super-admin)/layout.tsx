import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isSuperAdmin) redirect("/login");

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-neutral text-neutral-content px-6">
        <div className="flex-1">
          <span className="text-lg font-bold">Nest-POS</span>
          <span className="ml-3 badge badge-warning">Super Admin</span>
        </div>
        <div className="flex-none gap-4">
          <span className="text-sm opacity-70">{session.user.firstName}</span>
          <a href="/api/auth/signout" className="btn btn-sm btn-ghost">
            Sign Out
          </a>
        </div>
      </nav>
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-56 bg-base-100 border-r border-base-200 p-4">
          <ul className="menu menu-md gap-1">
            <li>
              <a href="/super-admin">Dashboard</a>
            </li>
            <li>
              <a href="/super-admin/tenants">Tenants</a>
            </li>
            <li>
              <a href="/super-admin/plans">Plans</a>
            </li>
          </ul>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
