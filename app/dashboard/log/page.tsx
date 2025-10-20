import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FormSubmissionsTable } from "@/components/form-submissions-table";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function LogPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Logs</h1>
            <p className="text-lg text-gray-600">View and manage form submissions - double-click on summary cards to view detailed tables</p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />
          </div>
          
          <FormSubmissionsTable />
        </div>
      </div>
    </div>
  );
}
