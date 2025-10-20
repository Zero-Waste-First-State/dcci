"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Alert {
  id: string;
  type: 'contamination' | 'issue';
  site: string;
  date_time: string;
  user: string;
  description: string;
  submission_id: number;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [contaminationRemoved, setContaminationRemoved] = useState<boolean>(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const showResolveConfirmation = async (alert: Alert) => {
    try {
      const supabase = createClient();
      
      // Fetch detailed information based on alert type
      if (alert.type === 'issue') {
        const { data: issueData, error } = await supabase
          .from('Issues')
          .select('*')
          .eq('issue_id', parseInt(alert.id.split('-')[1]))
          .single();
        
        if (error) throw error;
        setAlertDetails(issueData);
      } else {
        const { data: contaminationData, error } = await supabase
          .from('Litter')
          .select('*')
          .eq('litter_id', parseInt(alert.id.split('-')[1]))
          .single();
        
        if (error) throw error;
        setAlertDetails(contaminationData);
      }
      
      setSelectedAlert(alert);
      setShowConfirmModal(true);
      
      // Set contamination removed state after alertDetails is set
      if (alert.type === 'contamination') {
        setContaminationRemoved(alertDetails?.contamination_removed || false);
      } else {
        setContaminationRemoved(true); // Issues don't need this check
      }
    } catch (err) {
      console.error('Error fetching alert details:', err);
    }
  };

  const confirmResolve = async () => {
    if (!selectedAlert) return;
    
    try {
      setResolving(selectedAlert.id);
      const supabase = createClient();
      
      const tableName = selectedAlert.type === 'issue' ? 'Issues' : 'Litter';
      const idField = selectedAlert.type === 'issue' ? 'issue_id' : 'litter_id';
      const recordId = parseInt(selectedAlert.id.split('-')[1]);
      
      // For contamination, also update contamination_removed field
      const updateData = selectedAlert.type === 'contamination' 
        ? { resolved: true, contamination_removed: contaminationRemoved }
        : { resolved: true };
      
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq(idField, recordId);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      // Close modal and refresh alerts
      setShowConfirmModal(false);
      setSelectedAlert(null);
      setAlertDetails(null);
      await fetchAlerts();
    } catch (err) {
      console.error('Error marking alert as resolved:', err);
    } finally {
      setResolving(null);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch recent issues and contamination records separately (only unresolved)
      const [issuesResult, contaminationResult, submissionsResult] = await Promise.all([
        supabase
          .from('Issues')
          .select('*')
          .eq('resolved', false)
          .order('issue_id', { ascending: false })
          .limit(10),
        
        supabase
          .from('Litter')
          .select('*')
          .eq('resolved', false)
          .order('litter_id', { ascending: false })
          .limit(10),

        supabase
          .from('Form Submission')
          .select(`
            submission_id,
            timestamp,
            first_name,
            last_name,
            site_id,
            Site(site_name)
          `)
          .order('timestamp', { ascending: false })
          .limit(100)
      ]);

      if (issuesResult.error) {
        console.error('Error fetching issues:', issuesResult.error);
        throw issuesResult.error;
      }
      if (contaminationResult.error) {
        console.error('Error fetching contamination:', contaminationResult.error);
        throw contaminationResult.error;
      }
      if (submissionsResult.error) {
        console.error('Error fetching submissions:', submissionsResult.error);
        throw submissionsResult.error;
      }

      console.log('Issues data:', issuesResult.data);
      console.log('Contamination data:', contaminationResult.data);
      console.log('Submissions data:', submissionsResult.data);
      console.log('Issues count:', issuesResult.data?.length || 0);
      console.log('Contamination count:', contaminationResult.data?.length || 0);
      
      // Debug: Check if resolved column exists
      if (issuesResult.data && issuesResult.data.length > 0) {
        console.log('Issues table columns:', Object.keys(issuesResult.data[0]));
        console.log('Sample issue resolved value:', issuesResult.data[0].resolved);
        console.log('Issues table has resolved column:', 'resolved' in issuesResult.data[0]);
      }
      if (contaminationResult.data && contaminationResult.data.length > 0) {
        console.log('Litter table columns:', Object.keys(contaminationResult.data[0]));
        console.log('Sample contamination resolved value:', contaminationResult.data[0].resolved);
        console.log('Litter table has resolved column:', 'resolved' in contaminationResult.data[0]);
      }
      
      // Debug: Check if we have any data at all
      if ((issuesResult.data?.length || 0) === 0 && (contaminationResult.data?.length || 0) === 0) {
        console.log('No data found with resolved filter, trying without filter...');
        const [allIssuesResult, allContaminationResult] = await Promise.all([
          supabase.from('Issues').select('*').limit(3),
          supabase.from('Litter').select('*').limit(3)
        ]);
        console.log('All issues (first 3):', allIssuesResult.data);
        console.log('All contamination (first 3):', allContaminationResult.data);
        
        // Check if resolved column exists
        if (allIssuesResult.data && allIssuesResult.data.length > 0) {
          console.log('Issues table columns:', Object.keys(allIssuesResult.data[0]));
        }
        if (allContaminationResult.data && allContaminationResult.data.length > 0) {
          console.log('Litter table columns:', Object.keys(allContaminationResult.data[0]));
        }
      }

      const alerts: Alert[] = [];

      // Process issues
      if (issuesResult.data) {
        issuesResult.data.forEach((issue: any) => {
          const submission = submissionsResult.data?.find(s => s.submission_id === issue.submission_id);
          if (submission) {
            const siteName = (submission.Site as any)?.site_name || `Site ${submission.site_id}`;
            const userName = `${submission.first_name} ${submission.last_name}`;
            const dateTime = new Date(submission.timestamp).toLocaleString();

            // Create description based on issue types
            const issueTypes = [];
            if (issue.broken_tools) issueTypes.push('Broken tools');
            if (issue.bin_holes) issueTypes.push('Bin holes');
            if (issue.bad_odors) issueTypes.push('Bad odors');
            if (issue.fruit_flies_mice_other_vectors) issueTypes.push('Fruit flies, mice, or other unwanted vectors');
            if (issue.litter) issueTypes.push('Litter present');
            if (issue.other) issueTypes.push(issue.other);

            const description = issueTypes.join(', ');

            alerts.push({
              id: `issue-${issue.issue_id}`,
              type: 'issue',
              site: siteName,
              date_time: dateTime,
              user: userName,
              description: description,
              submission_id: issue.submission_id
            });
          }
        });
      }

      // Process contamination
      if (contaminationResult.data) {
        contaminationResult.data.forEach((contamination: any) => {
          const submission = submissionsResult.data?.find(s => s.submission_id === contamination.submission_id);
          if (submission) {
            const siteName = (submission.Site as any)?.site_name || `Site ${submission.site_id}`;
            const userName = `${submission.first_name} ${submission.last_name}`;
            const dateTime = new Date(submission.timestamp).toLocaleString();

            // Create description based on contamination types
            const contaminationTypes = [];
            if (contamination.plastic_trash) contaminationTypes.push('Plastic trash');
            if (contamination.food_stickers) contaminationTypes.push('Food stickers');
            if (contamination.prohibited_organics) contaminationTypes.push('Prohibited organics');
            if (contamination.other_trash) contaminationTypes.push(contamination.other_trash);

            const contaminatedBins = [];
            if (contamination.bin_1_contaminated) contaminatedBins.push('Bin 1');
            if (contamination.bin_2_contaminated) contaminatedBins.push('Bin 2');
            if (contamination.bin_3_contaminated) contaminatedBins.push('Bin 3');
            if (contamination.bin_4_contaminated) contaminatedBins.push('Bin 4');

            let description = '';
            if (contaminatedBins.length > 0) {
              description += `Contaminated bins: ${contaminatedBins.join(', ')}`;
            }
            if (contaminationTypes.length > 0) {
              description += description ? `; Types: ${contaminationTypes.join(', ')}` : `Types: ${contaminationTypes.join(', ')}`;
            }

            alerts.push({
              id: `contamination-${contamination.litter_id}`,
              type: 'contamination',
              site: siteName,
              date_time: dateTime,
              user: userName,
              description: description,
              submission_id: contamination.submission_id
            });
          }
        });
      }

      // Sort by timestamp and take the most recent 5
      alerts.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
      setAlerts(alerts.slice(0, 5));

    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-purple-100 border-4 border-purple-400 shadow rounded-lg">
        <div className="px-6 py-4 border-b-4 border-purple-400">
          <h3 className="text-lg font-medium text-gray-900">New Alerts</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">Loading alerts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-100 border-4 border-purple-400 shadow rounded-lg">
      <div className="px-6 py-4 border-b-4 border-purple-400">
        <h3 className="text-lg font-medium text-gray-900">New Alerts</h3>
      </div>
      <div className="p-6 space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No recent alerts
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${
                alert.type === 'issue'
                  ? 'bg-red-100 border-red-400'
                  : 'bg-orange-100 border-orange-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      alert.type === 'issue'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      {alert.type === 'issue' ? 'Issue' : 'Contamination'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{alert.site}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{alert.date_time}</span>
                      <span>by {alert.user}</span>
                    </div>
                    <button
                      onClick={() => showResolveConfirmation(alert)}
                      disabled={resolving === alert.id}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {resolving === alert.id ? 'Resolving...' : 'Mark as Resolved'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAlert && alertDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Confirm Resolution - {selectedAlert.type === 'issue' ? 'Issue' : 'Contamination'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Please review the details below before marking as resolved
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedAlert(null);
                    setAlertDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                  title="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-black">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Site</label>
                    <p className="mt-1 text-sm text-black">{selectedAlert.site}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reported By</label>
                    <p className="mt-1 text-sm text-black">{selectedAlert.user}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date/Time</label>
                    <p className="mt-1 text-sm text-black">{selectedAlert.date_time}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submission ID</label>
                    <p className="mt-1 text-sm text-black">{selectedAlert.submission_id}</p>
                  </div>
                </div>

                {/* Issue Details */}
                {selectedAlert.type === 'issue' && (
                  <div>
                    <h4 className="text-md font-medium text-black mb-2">Issue Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded border ${alertDetails.broken_tools ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Broken Tools</p>
                        <p className={`font-semibold ${alertDetails.broken_tools ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.broken_tools ? 'Reported' : 'Not reported'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.bin_holes ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bin Holes</p>
                        <p className={`font-semibold ${alertDetails.bin_holes ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bin_holes ? 'Reported' : 'Not reported'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.bad_odors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bad Odors</p>
                        <p className={`font-semibold ${alertDetails.bad_odors ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bad_odors ? 'Reported' : 'Not reported'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.fruit_flies_mice_other_vectors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Fruit Flies/Mice/Vectors</p>
                        <p className={`font-semibold ${alertDetails.fruit_flies_mice_other_vectors ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.fruit_flies_mice_other_vectors ? 'Reported' : 'Not reported'}
                        </p>
                      </div>
                    </div>
                    {alertDetails.litter && (
                      <div className="mt-4 bg-orange-50 p-3 rounded border border-orange-200">
                        <p className="text-sm font-medium text-gray-700">Litter Present</p>
                        <p className="font-semibold text-orange-800">Yes</p>
                        {alertDetails.litter_desc && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Description</p>
                            <p className="text-black">{alertDetails.litter_desc}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {alertDetails.other && (
                      <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                        <p className="text-black">{alertDetails.other}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contamination Details */}
                {selectedAlert.type === 'contamination' && (
                  <div>
                    <h4 className="text-md font-medium text-black mb-2">Contamination Details</h4>
                    {!contaminationRemoved && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ You must mark the contamination as removed before resolving this alert.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded border ${alertDetails.bin_1_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bin 1</p>
                        <p className={`font-semibold ${alertDetails.bin_1_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bin_1_contaminated ? 'Contaminated' : 'Clean'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.bin_2_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bin 2</p>
                        <p className={`font-semibold ${alertDetails.bin_2_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bin_2_contaminated ? 'Contaminated' : 'Clean'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.bin_3_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bin 3</p>
                        <p className={`font-semibold ${alertDetails.bin_3_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bin_3_contaminated ? 'Contaminated' : 'Clean'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.bin_4_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Bin 4</p>
                        <p className={`font-semibold ${alertDetails.bin_4_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                          {alertDetails.bin_4_contaminated ? 'Contaminated' : 'Clean'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded border ${alertDetails.plastic_trash ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Plastic Trash</p>
                        <p className={`font-semibold ${alertDetails.plastic_trash ? 'text-orange-800' : 'text-gray-500'}`}>
                          {alertDetails.plastic_trash ? 'Found' : 'Not found'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.food_stickers ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Food Stickers</p>
                        <p className={`font-semibold ${alertDetails.food_stickers ? 'text-orange-800' : 'text-gray-500'}`}>
                          {alertDetails.food_stickers ? 'Found' : 'Not found'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${alertDetails.prohibited_organics ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Prohibited Organics</p>
                        <p className={`font-semibold ${alertDetails.prohibited_organics ? 'text-orange-800' : 'text-gray-500'}`}>
                          {alertDetails.prohibited_organics ? 'Found' : 'Not found'}
                        </p>
                      </div>
                      <div className={`p-3 rounded border ${contaminationRemoved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-sm font-medium text-gray-700">Contamination Removed</p>
                        <div className="mt-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="contamination_removed"
                              checked={contaminationRemoved === true}
                              onChange={() => setContaminationRemoved(true)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-green-800 font-medium">Yes - Contamination has been removed</span>
                          </label>
                          <label className="flex items-center space-x-2 mt-1">
                            <input
                              type="radio"
                              name="contamination_removed"
                              checked={contaminationRemoved === false}
                              onChange={() => setContaminationRemoved(false)}
                              className="text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-red-800 font-medium">No - Contamination still present</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    {alertDetails.other_trash && (
                      <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-sm font-medium text-gray-700">Other Trash Details</p>
                        <p className="text-black">{alertDetails.other_trash}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedAlert(null);
                      setAlertDetails(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmResolve}
                    disabled={resolving === selectedAlert.id || (selectedAlert.type === 'contamination' && !contaminationRemoved)}
                    className={`px-4 py-2 rounded transition-colors ${
                      resolving === selectedAlert.id || (selectedAlert.type === 'contamination' && !contaminationRemoved)
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {resolving === selectedAlert.id 
                      ? 'Resolving...' 
                      : selectedAlert.type === 'contamination' && !contaminationRemoved
                        ? 'Mark Contamination as Removed First'
                        : 'Confirm Resolution'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
