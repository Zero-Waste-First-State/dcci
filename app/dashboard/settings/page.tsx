import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SiteManager } from "@/components/site-manager";
import { EmailRecipientsManager } from "@/components/email-recipients-manager";

export default async function SettingsPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
            <p className="text-lg text-gray-600">Manage working sites and email alerts</p>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8" />
          </div>
          
          <div className="space-y-8">
            {/* Site Management */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Site Management</h2>
              <SiteManager />
            </div>

            {/* Email Management */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Email Alert Recipients</h2>
              <EmailRecipientsManager />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
