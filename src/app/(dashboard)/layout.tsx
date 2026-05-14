import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { TrialBanner } from "@/components/layout/TrialBanner";

// Authenticated app — never prerender statically
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-200">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Topbar />
        <TrialBanner />
        <main className="flex-1 p-4 md:p-6">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
