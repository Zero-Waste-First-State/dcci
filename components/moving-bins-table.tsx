"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface MovingBinRecord {
  moving_id: number;
  submission_id: number;
  move_bin1_bin2?: boolean;
  move_bin2_bin3?: boolean;
  move_bin3_bin4?: boolean;
  move_bin4_steel_bins?: boolean;
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

interface MovingBinsTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function MovingBinsTable({ highlightedEntryId, onEntryHighlighted }: MovingBinsTableProps = {}) {
  const [movingBins, setMovingBins] = useState<MovingBinRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovingBin, setSelectedMovingBin] = useState<MovingBinRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<MovingBinRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && movingBins.length > 0) {
      const targetMove = movingBins.find(m => m.moving_id === highlightedEntryId);
      if (targetMove) {
        setSelectedMovingBin(targetMove);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, movingBins, onEntryHighlighted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all moving bin records
      const { data: movingBinsData, error: movingBinsError } = await supabase
        .from('Moving Day')
        .select('*')
        .order('moving_id', { ascending: false });

      if (movingBinsError) throw movingBinsError;

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

      setMovingBins(movingBinsData || []);
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

  const getMovesDescription = (movingBin: MovingBinRecord) => {
    const moves = [];
    if (movingBin.move_bin1_bin2) moves.push('Bin 1 → Bin 2');
    if (movingBin.move_bin2_bin3) moves.push('Bin 2 → Bin 3');
    if (movingBin.move_bin3_bin4) moves.push('Bin 3 → Bin 4');
    if (movingBin.move_bin4_steel_bins) moves.push('Bin 4 → Steel Bins');
    return moves.length > 0 ? moves.join(', ') : 'No moves recorded';
  };

  const handleEdit = () => {
    if (selectedMovingBin) {
      setEditData({ ...selectedMovingBin });
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
        .from('Moving Day')
        .update({
          move_bin1_bin2: editData.move_bin1_bin2,
          move_bin2_bin3: editData.move_bin2_bin3,
          move_bin3_bin4: editData.move_bin3_bin4,
          move_bin4_steel_bins: editData.move_bin4_steel_bins
        })
        .eq('moving_id', editData.moving_id);

      if (error) throw error;

      // Update local state
      setMovingBins(prev => prev.map(movingBin => 
        movingBin.moving_id === editData.moving_id 
          ? editData 
          : movingBin
      ));

      // Update selected moving bin
      setSelectedMovingBin(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating moving bin:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof MovingBinRecord, value: boolean | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedMovingBin) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Moving Day')
        .delete()
        .eq('moving_id', selectedMovingBin.moving_id);

      if (error) throw error;

      // Update local state
      setMovingBins(prev => prev.filter(movingBin => 
        movingBin.moving_id !== selectedMovingBin.moving_id
      ));

      // Close modal
      setSelectedMovingBin(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting moving bin record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading moving bins data...</div>
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
      <div className="bg-indigo-100 border-4 border-indigo-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-indigo-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Moving Bins Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {movingBins.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-200" style={{ minWidth: '800px' }}>
            <thead className="bg-indigo-50">
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
                  Bin Moves
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movingBins.map((movingBin) => {
                const submission = getSubmissionInfo(movingBin.submission_id);
                return (
                  <tr key={movingBin.moving_id} className="hover:bg-indigo-50">
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
                        <div className="truncate" title={getMovesDescription(movingBin)}>
                          {getMovesDescription(movingBin)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedMovingBin(movingBin)}
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

      {/* Moving Bin Details Modal */}
      {selectedMovingBin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Moving Bin Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Moving ID: {selectedMovingBin.moving_id} | Submission ID: {selectedMovingBin.submission_id}
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
                      setSelectedMovingBin(null);
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
                    {/* Bin Movements */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">Bin Movements</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="move_bin1_bin2"
                            checked={editData.move_bin1_bin2 || false}
                            onChange={(e) => handleInputChange('move_bin1_bin2', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="move_bin1_bin2" className="text-sm font-medium text-gray-700">
                            Bin 1 → Bin 2
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="move_bin2_bin3"
                            checked={editData.move_bin2_bin3 || false}
                            onChange={(e) => handleInputChange('move_bin2_bin3', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="move_bin2_bin3" className="text-sm font-medium text-gray-700">
                            Bin 2 → Bin 3
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="move_bin3_bin4"
                            checked={editData.move_bin3_bin4 || false}
                            onChange={(e) => handleInputChange('move_bin3_bin4', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="move_bin3_bin4" className="text-sm font-medium text-gray-700">
                            Bin 3 → Bin 4
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="move_bin4_steel_bins"
                            checked={editData.move_bin4_steel_bins || false}
                            onChange={(e) => handleInputChange('move_bin4_steel_bins', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="move_bin4_steel_bins" className="text-sm font-medium text-gray-700">
                            Bin 4 → Steel Bins
                          </label>
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
                    {/* Bin Moves */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Bin Movements</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded border ${selectedMovingBin.move_bin1_bin2 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bin 1 → Bin 2</p>
                          <p className={`font-semibold ${selectedMovingBin.move_bin1_bin2 ? 'text-blue-800' : 'text-gray-500'}`}>
                            {selectedMovingBin.move_bin1_bin2 ? 'Completed' : 'Not performed'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedMovingBin.move_bin2_bin3 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bin 2 → Bin 3</p>
                          <p className={`font-semibold ${selectedMovingBin.move_bin2_bin3 ? 'text-blue-800' : 'text-gray-500'}`}>
                            {selectedMovingBin.move_bin2_bin3 ? 'Completed' : 'Not performed'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedMovingBin.move_bin3_bin4 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bin 3 → Bin 4</p>
                          <p className={`font-semibold ${selectedMovingBin.move_bin3_bin4 ? 'text-blue-800' : 'text-gray-500'}`}>
                            {selectedMovingBin.move_bin3_bin4 ? 'Completed' : 'Not performed'}
                          </p>
                        </div>
                        <div className={`p-3 rounded border ${selectedMovingBin.move_bin4_steel_bins ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-700">Bin 4 → Steel Bins</p>
                          <p className={`font-semibold ${selectedMovingBin.move_bin4_steel_bins ? 'text-blue-800' : 'text-gray-500'}`}>
                            {selectedMovingBin.move_bin4_steel_bins ? 'Completed' : 'Not performed'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="text-sm font-medium text-gray-700">Total Movements</p>
                        <p className="text-lg font-semibold text-green-800">
                          {[
                            selectedMovingBin.move_bin1_bin2,
                            selectedMovingBin.move_bin2_bin3,
                            selectedMovingBin.move_bin3_bin4,
                            selectedMovingBin.move_bin4_steel_bins
                          ].filter(Boolean).length} completed
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
       {showDeleteConfirmation && selectedMovingBin && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Moving Bins Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this moving bins record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Moving ID: {selectedMovingBin.moving_id}
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
