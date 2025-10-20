import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { PDFManager } from "@/components/pdf-manager";
import DnrecReportButton from "@/components/dnrec-report-button";

export default async function ReportsPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-white">
      <DashboardSidebar user={{ name: user.user_metadata?.full_name, email: user.email }} />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Reports</h1>
            <p className="text-lg text-gray-600">Manage PDF documents and generate reports</p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />
          </div>

          {/* DNREC Report Generator */}
          <div className="bg-amber-100 border-4 border-earthyBrown rounded-xl shadow-sm p-6 mb-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate DNREC Report</h3>
              <p className="text-gray-700">Generate official DNREC compliance reports by year</p>
            </div>
            <DnrecReportButton />
          </div>
          
          <PDFManager />
        </div>
      </div>
    </div>
  );
}
