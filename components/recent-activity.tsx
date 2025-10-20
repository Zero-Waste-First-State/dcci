"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ActivityRecord {
  id: string;
  activity: string;
  date_time: string;
  site: string;
  user: string;
  submission_id: number;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch recent form submissions with related data
      const { data: submissions, error } = await supabase
        .from('Form Submission')
        .select(`
          submission_id,
          timestamp,
          first_name,
          last_name,
          site_id,
          Site(site_name),
          Measurements(bin_type),
          "Adding Material"(bin_id),
          "Moving Day"(moving_id),
          "Finished Compost"(compost_id),
          "Browns Bin"(browns_id),
          Issues(issue_id),
          Litter(litter_id)
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform submissions into activity records
      const activityRecords: ActivityRecord[] = [];
      
      submissions?.forEach((submission) => {
        const siteName = (submission.Site as any)?.site_name || `Site ${submission.site_id}`;
        const userName = `${submission.first_name} ${submission.last_name}`;
        const dateTime = new Date(submission.timestamp).toLocaleString();

        // Check each activity type and create activity records (excluding issues and contamination)
        if (submission.Measurements && submission.Measurements.length > 0) {
          activityRecords.push({
            id: `measurement-${submission.submission_id}`,
            activity: "Measuring",
            date_time: dateTime,
            site: siteName,
            user: userName,
            submission_id: submission.submission_id
          });
        }

        if (submission["Adding Material"] && submission["Adding Material"].length > 0) {
          activityRecords.push({
            id: `material-${submission.submission_id}`,
            activity: "Adding Material",
            date_time: dateTime,
            site: siteName,
            user: userName,
            submission_id: submission.submission_id
          });
        }

        if (submission["Moving Day"] && submission["Moving Day"].length > 0) {
          activityRecords.push({
            id: `moving-${submission.submission_id}`,
            activity: "Moving Bins",
            date_time: dateTime,
            site: siteName,
            user: userName,
            submission_id: submission.submission_id
          });
        }

        if (submission["Finished Compost"] && submission["Finished Compost"].length > 0) {
          activityRecords.push({
            id: `compost-${submission.submission_id}`,
            activity: "Taking Finished Compost",
            date_time: dateTime,
            site: siteName,
            user: userName,
            submission_id: submission.submission_id
          });
        }

        if (submission["Browns Bin"] && submission["Browns Bin"].length > 0) {
          activityRecords.push({
            id: `browns-${submission.submission_id}`,
            activity: "Adding Browns",
            date_time: dateTime,
            site: siteName,
            user: userName,
            submission_id: submission.submission_id
          });
        }
      });

      // Sort by timestamp and take the most recent 15
      activityRecords.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
      setActivities(activityRecords.slice(0, 15));

    } catch (err) {
      console.error('Error fetching recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">Loading recent activity...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border-4 border-blue-400 shadow rounded-lg h-full flex flex-col">
      <div className="px-6 py-4 border-b-4 border-blue-400">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200" style={{ height: '100%' }}>
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-semibold">
                  {activity.activity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {activity.date_time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  {activity.site}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.user}
                </td>
              </tr>
            ))}
            {/* Fill remaining space with empty rows */}
            {Array.from({ length: Math.max(0, 15 - activities.length) }).map((_, index) => (
              <tr key={`empty-${index}`} style={{ height: '48px' }}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  &nbsp;
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  &nbsp;
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  &nbsp;
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  &nbsp;
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
