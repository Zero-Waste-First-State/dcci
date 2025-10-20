"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface IssueRecord {
  issue_id: number;
  submission_id: number;
  broken_tools?: boolean;
  bin_holes?: boolean;
  bad_odors?: boolean;
  fruit_flies_mice_other_vectors?: boolean;
  other?: string;
  litter?: boolean;
  litter_desc?: string;
  resolved?: boolean;
}

interface FormSubmission {
  submission_id: number;
  timestamp: string;
  site_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  site_name?: string;
  Site: {
    site_name: string;
  } | null;
}

interface IssuesTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function IssuesTable({ highlightedEntryId, onEntryHighlighted }: IssuesTableProps = {}) {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [issueToResolve, setIssueToResolve] = useState<IssueRecord | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [issueToToggle, setIssueToToggle] = useState<IssueRecord | null>(null);
  const [toggleToResolved, setToggleToResolved] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<IssueRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && issues.length > 0) {
      const targetIssue = issues.find(i => i.issue_id === highlightedEntryId);
      if (targetIssue) {
        setSelectedIssue(targetIssue);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, issues, onEntryHighlighted]);

  const showResolveConfirmation = (issue: IssueRecord) => {
    setIssueToResolve(issue);
    setShowResolveModal(true);
  };

  const confirmResolve = async () => {
    if (!issueToResolve) return;
    
    try {
      setToggling(issueToResolve.issue_id);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('Issues')
        .update({ resolved: true })
        .eq('issue_id', issueToResolve.issue_id);
      
      if (error) throw error;
      
      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.issue_id === issueToResolve.issue_id 
          ? { ...issue, resolved: true }
          : issue
      ));
      
      // Close modal
      setShowResolveModal(false);
      setIssueToResolve(null);
    } catch (err) {
      console.error('Error resolving issue:', err);
    } finally {
      setToggling(null);
    }
  };

  const showToggleConfirmation = (issue: IssueRecord) => {
    setIssueToToggle(issue);
    setToggleToResolved(!issue.resolved);
    setShowToggleModal(true);
  };

  const confirmToggle = async () => {
    if (!issueToToggle) return;
    
    try {
      setToggling(issueToToggle.issue_id);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('Issues')
        .update({ resolved: toggleToResolved })
        .eq('issue_id', issueToToggle.issue_id);
      
      if (error) throw error;
      
      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.issue_id === issueToToggle.issue_id 
          ? { ...issue, resolved: toggleToResolved }
          : issue
      ));
      
      // Close modal
      setShowToggleModal(false);
      setIssueToToggle(null);
    } catch (err) {
      console.error('Error toggling resolved status:', err);
    } finally {
      setToggling(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all issue records
      const { data: issuesData, error: issuesError } = await supabase
        .from('Issues')
        .select('*')
        .order('issue_id', { ascending: false });

      if (issuesError) throw issuesError;

      // Fetch form submissions for context
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('Form Submission')
        .select(`
          *,
          Site(site_name)
        `)
        .order('timestamp', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Flatten the Site data for easier access
      const flattenedSubmissions = (submissionsData || []).map(submission => ({
        ...submission,
        site_name: submission.Site?.site_name
      }));

      setIssues(issuesData || []);
      setSubmissions(flattenedSubmissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionInfo = (submissionId: number) => {
    const submission = submissions.find(s => s.submission_id === submissionId);
    return submission;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIssuesSummary = (issue: IssueRecord) => {
    const issues = [];
    if (issue.broken_tools) issues.push('Broken Tools');
    if (issue.bin_holes) issues.push('Bin Holes');
    if (issue.bad_odors) issues.push('Bad Odors');
    if (issue.fruit_flies_mice_other_vectors) issues.push('Fruit Flies/Mice/Vectors');
    if (issue.other) issues.push('Other');
    return issues.length > 0 ? issues.join(', ') : 'No issues recorded';
  };

  const handleEdit = () => {
    if (selectedIssue) {
      setEditData({ ...selectedIssue });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Issues')
        .update({
          broken_tools: editData.broken_tools,
          bin_holes: editData.bin_holes,
          bad_odors: editData.bad_odors,
          fruit_flies_mice_other_vectors: editData.fruit_flies_mice_other_vectors,
          other: editData.other
        })
        .eq('issue_id', editData.issue_id);

      if (error) throw error;

      // Update local state
      setIssues(prev => prev.map(issue => 
        issue.issue_id === editData.issue_id 
          ? editData 
          : issue
      ));

      // Update selected issue
      setSelectedIssue(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating issue:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof IssueRecord, value: string | boolean | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedIssue) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Issues')
        .delete()
        .eq('issue_id', selectedIssue.issue_id);

      if (error) throw error;

      // Update local state
      setIssues(prev => prev.filter(issue => 
        issue.issue_id !== selectedIssue.issue_id
      ));

      // Close modal
      setSelectedIssue(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting issue record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading issues data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-100 border-4 border-red-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-red-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Issues Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {issues.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-red-200" style={{ minWidth: '1000px' }}>
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => {
                const submission = getSubmissionInfo(issue.submission_id);
                return (
                  <tr key={issue.issue_id} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? formatDate(submission.timestamp) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? `${submission.first_name} ${submission.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? (submission.site_name || `Site ${submission.site_id}`) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <div className="truncate" title={getIssuesSummary(issue)}>
                          {getIssuesSummary(issue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.resolved ? (
                        <button
                          onClick={() => showToggleConfirmation(issue)}
                          disabled={toggling === issue.issue_id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {toggling === issue.issue_id ? 'Updating...' : 'Resolved'}
                        </button>
                      ) : (
                        <button
                          onClick={() => showResolveConfirmation(issue)}
                          disabled={toggling === issue.issue_id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {toggling === issue.issue_id ? 'Resolving...' : 'Resolve'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Issue Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Issue ID: {selectedIssue.issue_id} | Submission ID: {selectedIssue.submission_id}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedIssue(null);
                      setIsEditing(false);
                      setEditData(null);
                      setShowDeleteConfirmation(false);
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
              </div>

              <div className="space-y-4">
                {isEditing && editData ? (
                  // Edit Mode
                  <div className="space-y-6">
                    {/* Issue Types */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="text-lg font-semibold text-red-900 mb-4">Issue Types</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="broken_tools"
                            checked={editData.broken_tools || false}
                            onChange={(e) => handleInputChange('broken_tools', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="broken_tools" className="text-sm font-medium text-gray-700">
                            Broken Tools
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bin_holes"
                            checked={editData.bin_holes || false}
                            onChange={(e) => handleInputChange('bin_holes', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bin_holes" className="text-sm font-medium text-gray-700">
                            Bin Holes
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bad_odors"
                            checked={editData.bad_odors || false}
                            onChange={(e) => handleInputChange('bad_odors', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bad_odors" className="text-sm font-medium text-gray-700">
                            Bad Odors
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="fruit_flies_mice_other_vectors"
                            checked={editData.fruit_flies_mice_other_vectors || false}
                            onChange={(e) => handleInputChange('fruit_flies_mice_other_vectors', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="fruit_flies_mice_other_vectors" className="text-sm font-medium text-gray-700">
                            Fruit Flies/Mice/Vectors
                          </label>
                        </div>
                      </div>
                    </div>


                    {/* Other Issues */}
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="text-lg font-semibold text-yellow-900 mb-4">Other Issues</h4>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          value={editData.other || ''}
                          onChange={(e) => handleInputChange('other', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                          rows={3}
                          placeholder="Describe any other issues"
                        />
                      </div>
                    </div>


                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-4 text-black">
                    {/* Issue Types */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Issue Types</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded border ${selectedIssue.broken_tools ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Broken Tools</p>
                          <p className={`font-semibold ${selectedIssue.broken_tools ? 'text-red-800' : 'text-gray-500'}`}>
                            {selectedIssue.broken_tools ? 'Reported' : 'Not reported'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedIssue.bin_holes ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bin Holes</p>
                          <p className={`font-semibold ${selectedIssue.bin_holes ? 'text-red-800' : 'text-gray-500'}`}>
                            {selectedIssue.bin_holes ? 'Reported' : 'Not reported'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedIssue.bad_odors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bad Odors</p>
                          <p className={`font-semibold ${selectedIssue.bad_odors ? 'text-red-800' : 'text-gray-500'}`}>
                            {selectedIssue.bad_odors ? 'Reported' : 'Not reported'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedIssue.fruit_flies_mice_other_vectors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Fruit Flies/Mice/Vectors</p>
                          <p className={`font-semibold ${selectedIssue.fruit_flies_mice_other_vectors ? 'text-red-800' : 'text-gray-500'}`}>
                            {selectedIssue.fruit_flies_mice_other_vectors ? 'Reported' : 'Not reported'}
                          </p>
                        </div>
                      </div>
                    </div>


                    {/* Other Issues */}
                    {selectedIssue.other && (
                      <div>
                        <h4 className="text-md font-medium text-black mb-2">Other Issues</h4>
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                          <p className="text-black">{selectedIssue.other}</p>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm font-medium text-gray-700">Total Issues Reported</p>
                        <p className="text-lg font-semibold text-blue-800">
                          {[
                            selectedIssue.broken_tools,
                            selectedIssue.bin_holes,
                            selectedIssue.bad_odors,
                            selectedIssue.fruit_flies_mice_other_vectors,
                            selectedIssue.other
                          ].filter(Boolean).length} issues
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
         </div>
       )}

       {/* Resolve Confirmation Modal */}
       {showResolveModal && issueToResolve && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">
                     Confirm Issue Resolution
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     Please review the issue details below before marking as resolved
                   </p>
                 </div>
                 <button
                   onClick={() => {
                     setShowResolveModal(false);
                     setIssueToResolve(null);
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
                     <label className="block text-sm font-medium text-gray-700">Submission ID</label>
                     <p className="mt-1 text-sm text-black">{issueToResolve.submission_id}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Issue ID</label>
                     <p className="mt-1 text-sm text-black">{issueToResolve.issue_id}</p>
                   </div>
                 </div>

                 {/* Issue Details */}
                 <div>
                   <h4 className="text-md font-medium text-black mb-2">Issue Details</h4>
                   <div className="grid grid-cols-2 gap-4">
                     <div className={`p-3 rounded border ${issueToResolve.broken_tools ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Broken Tools</p>
                       <p className={`font-semibold ${issueToResolve.broken_tools ? 'text-red-800' : 'text-gray-500'}`}>
                         {issueToResolve.broken_tools ? 'Reported' : 'Not reported'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${issueToResolve.bin_holes ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bin Holes</p>
                       <p className={`font-semibold ${issueToResolve.bin_holes ? 'text-red-800' : 'text-gray-500'}`}>
                         {issueToResolve.bin_holes ? 'Reported' : 'Not reported'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${issueToResolve.bad_odors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bad Odors</p>
                       <p className={`font-semibold ${issueToResolve.bad_odors ? 'text-red-800' : 'text-gray-500'}`}>
                         {issueToResolve.bad_odors ? 'Reported' : 'Not reported'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${issueToResolve.fruit_flies_mice_other_vectors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Fruit Flies/Mice/Vectors</p>
                       <p className={`font-semibold ${issueToResolve.fruit_flies_mice_other_vectors ? 'text-red-800' : 'text-gray-500'}`}>
                         {issueToResolve.fruit_flies_mice_other_vectors ? 'Reported' : 'Not reported'}
                       </p>
                     </div>
                   </div>
                   {issueToResolve.litter && (
                     <div className="mt-4 bg-orange-50 p-3 rounded border border-orange-200">
                       <p className="text-sm font-medium text-gray-700">Litter Present</p>
                       <p className="font-semibold text-orange-800">Yes</p>
                       {issueToResolve.litter_desc && (
                         <div className="mt-2">
                           <p className="text-sm font-medium text-gray-700">Description</p>
                           <p className="text-black">{issueToResolve.litter_desc}</p>
                         </div>
                       )}
                     </div>
                   )}
                   {issueToResolve.other && (
                     <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                       <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                       <p className="text-black">{issueToResolve.other}</p>
                     </div>
                   )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                   <button
                     onClick={() => {
                       setShowResolveModal(false);
                       setIssueToResolve(null);
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={confirmResolve}
                     disabled={toggling === issueToResolve.issue_id}
                     className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     {toggling === issueToResolve.issue_id ? 'Resolving...' : 'Confirm Resolution'}
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Toggle Status Confirmation Modal */}
       {showToggleModal && issueToToggle && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">
                     {toggleToResolved ? 'Mark as Resolved' : 'Mark as Unresolved'}
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     {toggleToResolved 
                       ? 'Are you sure you want to mark this issue as resolved?'
                       : 'Are you sure you want to mark this issue as unresolved?'
                     }
                   </p>
                 </div>
                 <button
                   onClick={() => {
                     setShowToggleModal(false);
                     setIssueToToggle(null);
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
                     <label className="block text-sm font-medium text-gray-700">Submission ID</label>
                     <p className="mt-1 text-sm text-black">{issueToToggle.submission_id}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Issue ID</label>
                     <p className="mt-1 text-sm text-black">{issueToToggle.issue_id}</p>
                   </div>
                 </div>

                 {/* Current Status */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Current Status</label>
                   <div className={`mt-1 p-3 rounded border ${issueToToggle.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <p className={`font-semibold ${issueToToggle.resolved ? 'text-green-800' : 'text-red-800'}`}>
                       {issueToToggle.resolved ? 'Resolved' : 'Unresolved'}
                     </p>
                   </div>
                 </div>

                 {/* New Status */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700">New Status</label>
                   <div className={`mt-1 p-3 rounded border ${toggleToResolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <p className={`font-semibold ${toggleToResolved ? 'text-green-800' : 'text-red-800'}`}>
                       {toggleToResolved ? 'Resolved' : 'Unresolved'}
                     </p>
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                   <button
                     onClick={() => {
                       setShowToggleModal(false);
                       setIssueToToggle(null);
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={confirmToggle}
                     disabled={toggling === issueToToggle.issue_id}
                     className={`px-4 py-2 rounded transition-colors ${
                       toggling === issueToToggle.issue_id
                         ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                         : toggleToResolved
                           ? 'bg-green-600 text-white hover:bg-green-700'
                           : 'bg-red-600 text-white hover:bg-red-700'
                     }`}
                   >
                     {toggling === issueToToggle.issue_id 
                       ? 'Updating...' 
                       : toggleToResolved
                         ? 'Mark as Resolved'
                         : 'Mark as Unresolved'
                     }
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirmation && selectedIssue && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Issue Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this issue record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Issue ID: {selectedIssue.issue_id}
                   </div>
                 </div>
                 <div className="flex justify-center space-x-4 px-4 py-3">
                   <button
                     onClick={() => setShowDeleteConfirmation(false)}
                     className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleDelete}
                     disabled={deleting}
                     className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {deleting ? 'Deleting...' : 'Delete'}
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
