import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function POSLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.isSuperAdmin) redirect("/super-admin");

  return <div className="min-h-screen bg-base-200">{children}</div>;
}
