"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface FinishedCompostRecord {
  compost_id: number;
  submission_id: number;
  gallons_compost_taken?: number;
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

interface FinishedCompostTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function FinishedCompostTable({ highlightedEntryId, onEntryHighlighted }: FinishedCompostTableProps = {}) {
  const [finishedCompost, setFinishedCompost] = useState<FinishedCompostRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompost, setSelectedCompost] = useState<FinishedCompostRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<FinishedCompostRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && finishedCompost.length > 0) {
      const targetCompost = finishedCompost.find(c => c.compost_id === highlightedEntryId);
      if (targetCompost) {
        setSelectedCompost(targetCompost);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, finishedCompost, onEntryHighlighted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all finished compost records
      const { data: finishedCompostData, error: finishedCompostError } = await supabase
        .from('Finished Compost')
        .select('*')
        .order('compost_id', { ascending: false });

      if (finishedCompostError) throw finishedCompostError;

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

      setFinishedCompost(finishedCompostData || []);
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

  const handleEdit = () => {
    if (selectedCompost) {
      setEditData({ ...selectedCompost });
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
        .from('Finished Compost')
        .update({
          gallons_compost_taken: editData.gallons_compost_taken
        })
        .eq('compost_id', editData.compost_id);

      if (error) throw error;

      // Update local state
      setFinishedCompost(prev => prev.map(compost => 
        compost.compost_id === editData.compost_id 
          ? editData 
          : compost
      ));

      // Update selected compost
      setSelectedCompost(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating finished compost:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof FinishedCompostRecord, value: string | number | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompost) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Finished Compost')
        .delete()
        .eq('compost_id', selectedCompost.compost_id);

      if (error) throw error;

      // Update local state
      setFinishedCompost(prev => prev.filter((compost: FinishedCompostRecord) => 
        compost.compost_id !== selectedCompost.compost_id
      ));

      // Close modal
      setSelectedCompost(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting finished compost record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading finished compost data...</div>
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
      <div className="bg-lime-100 border-4 border-lime-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-lime-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Finished Compost Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {finishedCompost.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lime-200" style={{ minWidth: '800px' }}>
            <thead className="bg-lime-50">
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
                  Gallons Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {finishedCompost.map((compost) => {
                const submission = getSubmissionInfo(compost.submission_id);
                // Note: Finished compost is only reported in gallons, not converted to weight
                
                return (
                  <tr key={compost.compost_id} className="hover:bg-lime-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? formatDate(submission.timestamp) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? `${submission.first_name} ${submission.last_name}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission ? (submission.site_name || `Site ${submission.site_id}`) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {compost.gallons_compost_taken || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCompost(compost)}
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

      {/* Finished Compost Details Modal */}
      {selectedCompost && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Finished Compost Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Compost ID: {selectedCompost.compost_id} | Submission ID: {selectedCompost.submission_id}
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
                      setSelectedCompost(null);
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
                    {/* Finished Compost Information */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="text-lg font-semibold text-green-900 mb-4">Finished Compost Information</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Gallons of Finished Compost Taken</label>
                          <input
                            type="number"
                            value={editData.gallons_compost_taken || ''}
                            onChange={(e) => handleInputChange('gallons_compost_taken', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            placeholder="Enter gallons taken"
                            min="0"
                            step="0.1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the number of gallons of finished compost that were taken
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Weight Calculation Preview */}
                    {editData.gallons_compost_taken && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-900 mb-4">Weight Calculation Preview</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium text-gray-700">Gallons Entered</p>
                            <p className="text-lg font-semibold text-blue-800">
                              {editData.gallons_compost_taken} gal
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border border-blue-200">
                            <p className="text-sm font-medium text-gray-700">Volume</p>
                            <p className="text-lg font-semibold text-blue-800">
                              {editData.gallons_compost_taken} gallons
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                          <p className="text-sm text-blue-800">
                            <strong>Volume:</strong> {editData.gallons_compost_taken} gallons of finished compost
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            * Finished compost is reported in gallons only
                          </p>
                        </div>
                      </div>
                    )}

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
                    {/* Compost Information */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Finished Compost Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-gray-700">Gallons Taken</p>
                          <p className="text-lg font-semibold text-green-800">
                            {selectedCompost.gallons_compost_taken ? `${selectedCompost.gallons_compost_taken} gal` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Estimated Weight</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {(() => {
                              const gallons = selectedCompost.gallons_compost_taken || 0;
                              const weight = gallons * 8.34; // Standard conversion: 8.34 lbs/gallon
                              return weight > 0 ? `${weight} lbs` : 'N/A';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Details */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Volume Information</h4>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Volume Recorded</p>
                        <p className="text-black">
                          {selectedCompost.gallons_compost_taken 
                            ? `${selectedCompost.gallons_compost_taken} gallons of finished compost`
                            : 'No gallons recorded'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          * Finished compost is reported in gallons only
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                      <div className="bg-amber-50 p-3 rounded border border-amber-200">
                        <p className="text-sm font-medium text-gray-700">Finished Compost Summary</p>
                        <p className="text-lg font-semibold text-amber-800">
                          {selectedCompost.gallons_compost_taken 
                            ? `${selectedCompost.gallons_compost_taken} gallons of finished compost taken`
                            : 'No finished compost taken recorded'
                          }
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

       {/* Delete Confirmation Modal */}
       {showDeleteConfirmation && selectedCompost && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Finished Compost Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this finished compost record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Compost ID: {selectedCompost.compost_id}
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
