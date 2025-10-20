"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface BrownsBinRecord {
  browns_id: number;
  submission_id: number;
  bin_a_browns_gallons?: number;
  bin_b_browns_gallons?: number;
  bin_a_red_line?: boolean;
  bin_b_red_line?: boolean;
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

interface BrownsBinTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function BrownsBinTable({ highlightedEntryId, onEntryHighlighted }: BrownsBinTableProps = {}) {
  const [brownsBins, setBrownsBins] = useState<BrownsBinRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrownsBin, setSelectedBrownsBin] = useState<BrownsBinRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<BrownsBinRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && brownsBins.length > 0) {
      const targetBrowns = brownsBins.find(b => b.browns_id === highlightedEntryId);
      if (targetBrowns) {
        setSelectedBrownsBin(targetBrowns);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, brownsBins, onEntryHighlighted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all browns bin records
      const { data: brownsBinsData, error: brownsBinsError } = await supabase
        .from('Browns Bin')
        .select('*')
        .order('browns_id', { ascending: false });

      if (brownsBinsError) throw brownsBinsError;

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

      setBrownsBins(brownsBinsData || []);
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
    if (selectedBrownsBin) {
      setEditData({ ...selectedBrownsBin });
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
        .from('Browns Bin')
        .update({
          bin_a_browns_gallons: editData.bin_a_browns_gallons,
          bin_b_browns_gallons: editData.bin_b_browns_gallons,
          bin_a_red_line: editData.bin_a_red_line,
          bin_b_red_line: editData.bin_b_red_line
        })
        .eq('browns_id', editData.browns_id);

      if (error) throw error;

      // Update local state
      setBrownsBins(prev => prev.map(brownsBin => 
        brownsBin.browns_id === editData.browns_id 
          ? editData 
          : brownsBin
      ));

      // Update selected browns bin
      setSelectedBrownsBin(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating browns bin:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof BrownsBinRecord, value: string | number | boolean | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedBrownsBin) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Browns Bin')
        .delete()
        .eq('browns_id', selectedBrownsBin.browns_id);

      if (error) throw error;

      // Update local state
      setBrownsBins(prev => prev.filter(brownsBin => 
        brownsBin.browns_id !== selectedBrownsBin.browns_id
      ));

      // Close modal
      setSelectedBrownsBin(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting browns bin record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading browns bin data...</div>
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
      <div className="bg-amber-100 border-4 border-amber-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-amber-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Browns Bin Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {brownsBins.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-amber-200" style={{ minWidth: '1000px' }}>
            <thead className="bg-amber-50">
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
                  Bin A (gallons)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bin A Red Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bin B (gallons)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bin B Red Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brownsBins.map((brownsBin) => {
                const submission = getSubmissionInfo(brownsBin.submission_id);
                return (
                  <tr key={brownsBin.browns_id} className="hover:bg-amber-50">
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
                      {brownsBin.bin_a_browns_gallons || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        brownsBin.bin_a_red_line 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {brownsBin.bin_a_red_line ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {brownsBin.bin_b_browns_gallons || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        brownsBin.bin_b_red_line 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {brownsBin.bin_b_red_line ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedBrownsBin(brownsBin)}
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

      {/* Browns Bin Details Modal */}
      {selectedBrownsBin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Browns Bin Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Browns ID: {selectedBrownsBin.browns_id} | Submission ID: {selectedBrownsBin.submission_id}
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
                      setSelectedBrownsBin(null);
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
                    {/* Bin A Information */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-900 mb-4">Bin A</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Browns (gallons)</label>
                          <input
                            type="number"
                            value={editData.bin_a_browns_gallons || ''}
                            onChange={(e) => handleInputChange('bin_a_browns_gallons', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            placeholder="Enter gallons"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">At Red Line</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="bin_a_red_line"
                              checked={editData.bin_a_red_line || false}
                              onChange={(e) => handleInputChange('bin_a_red_line', e.target.checked)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="bin_a_red_line" className="text-sm font-medium text-gray-700">
                              Bin A is at red line
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bin B Information */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-900 mb-4">Bin B</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Browns (gallons)</label>
                          <input
                            type="number"
                            value={editData.bin_b_browns_gallons || ''}
                            onChange={(e) => handleInputChange('bin_b_browns_gallons', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            placeholder="Enter gallons"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">At Red Line</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="bin_b_red_line"
                              checked={editData.bin_b_red_line || false}
                              onChange={(e) => handleInputChange('bin_b_red_line', e.target.checked)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="bin_b_red_line" className="text-sm font-medium text-gray-700">
                              Bin B is at red line
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Preview */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">Summary Preview</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Total Browns Added</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {(() => {
                              const binA = editData.bin_a_browns_gallons || 0;
                              const binB = editData.bin_b_browns_gallons || 0;
                              const total = binA + binB;
                              return total > 0 ? `${total} gallons` : 'No quantities recorded';
                            })()}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Bins at Red Line</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {[editData.bin_a_red_line, editData.bin_b_red_line].filter(Boolean).length} of 2
                          </p>
                        </div>
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
                    {/* Bin A Information */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Bin A</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Browns (gallons)</p>
                          <p className="text-lg font-semibold text-amber-800">
                            {selectedBrownsBin.bin_a_browns_gallons ? `${selectedBrownsBin.bin_a_browns_gallons} gal` : 'N/A'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedBrownsBin.bin_a_red_line ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm font-medium text-gray-700">At Red Line</p>
                          <p className={`font-semibold ${selectedBrownsBin.bin_a_red_line ? 'text-red-800' : 'text-green-800'}`}>
                            {selectedBrownsBin.bin_a_red_line ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bin B Information */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Bin B</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Browns (gallons)</p>
                          <p className="text-lg font-semibold text-amber-800">
                            {selectedBrownsBin.bin_b_browns_gallons ? `${selectedBrownsBin.bin_b_browns_gallons} gal` : 'N/A'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedBrownsBin.bin_b_red_line ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm font-medium text-gray-700">At Red Line</p>
                          <p className={`font-semibold ${selectedBrownsBin.bin_b_red_line ? 'text-red-800' : 'text-green-800'}`}>
                            {selectedBrownsBin.bin_b_red_line ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Total Browns Added</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {(() => {
                            const binA = selectedBrownsBin.bin_a_browns_gallons || 0;
                            const binB = selectedBrownsBin.bin_b_browns_gallons || 0;
                            const total = binA + binB;
                            return total > 0 ? `${total} gallons` : 'No quantities recorded';
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Status Overview</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded border ${selectedBrownsBin.bin_a_red_line || selectedBrownsBin.bin_b_red_line ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Overall Status</p>
                          <p className={`font-semibold ${selectedBrownsBin.bin_a_red_line || selectedBrownsBin.bin_b_red_line ? 'text-orange-800' : 'text-green-800'}`}>
                            {selectedBrownsBin.bin_a_red_line || selectedBrownsBin.bin_b_red_line ? 'At Capacity' : 'Normal'}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Bins at Red Line</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {[selectedBrownsBin.bin_a_red_line, selectedBrownsBin.bin_b_red_line].filter(Boolean).length} of 2
                          </p>
                        </div>
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
       {showDeleteConfirmation && selectedBrownsBin && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Browns Bin Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this browns bin record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Browns ID: {selectedBrownsBin.browns_id}
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
