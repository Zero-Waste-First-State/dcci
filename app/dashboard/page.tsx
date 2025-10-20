import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { RecentActivity } from "@/components/recent-activity";
import { AlertsPanel } from "@/components/alerts-panel";
import { WeightDistributionGraph } from "@/components/weight-distribution-graph";
import { DailyCalendar } from "@/components/daily-calendar";

export default async function DashboardPage() {
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">DCCI Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back, {user.user_metadata?.full_name || 'Staff'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Recent Activity */}
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>

            {/* Right Column - Alerts */}
            <div>
              <AlertsPanel />
            </div>
          </div>

          {/* Bottom Section - Weight Distribution Graph */}
          <div className="mt-6">
            <WeightDistributionGraph />
          </div>

          {/* Calendar Section */}
          <div className="mt-6">
            <DailyCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}
