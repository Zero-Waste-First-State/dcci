import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FinishedCompostTable } from "@/components/finished-compost-table";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function FinishedCompostPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar user={{ name: user.user_metadata?.full_name, email: user.email }} />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Finished Compost</h1>
            <p className="text-gray-600 mt-2">View and manage finished compost records</p>
          </div>
          
          <FinishedCompostTable />
        </div>
      </div>
    </div>
  );
}
