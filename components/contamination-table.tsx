"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ContaminationRecord {
  litter_id: number;
  submission_id: number;
  bin_1_contaminated?: boolean;
  bin_2_contaminated?: boolean;
  bin_3_contaminated?: boolean;
  bin_4_contaminated?: boolean;
  plastic_trash?: boolean;
  food_stickers?: boolean;
  prohibited_organics?: boolean;
  other_trash?: string;
  contamination_removed?: boolean;
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

interface ContaminationTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function ContaminationTable({ highlightedEntryId, onEntryHighlighted }: ContaminationTableProps = {}) {
  const [contaminations, setContaminations] = useState<ContaminationRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContamination, setSelectedContamination] = useState<ContaminationRecord | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [contaminationToResolve, setContaminationToResolve] = useState<ContaminationRecord | null>(null);
  const [contaminationRemoved, setContaminationRemoved] = useState<boolean>(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [contaminationToToggle, setContaminationToToggle] = useState<ContaminationRecord | null>(null);
  const [toggleToResolved, setToggleToResolved] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ContaminationRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && contaminations.length > 0) {
      const targetContamination = contaminations.find(c => c.litter_id === highlightedEntryId);
      if (targetContamination) {
        setSelectedContamination(targetContamination);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, contaminations, onEntryHighlighted]);

  const showResolveConfirmation = (contamination: ContaminationRecord) => {
    setContaminationToResolve(contamination);
    setContaminationRemoved(contamination.contamination_removed || false);
    setShowResolveModal(true);
  };

  const confirmResolve = async () => {
    if (!contaminationToResolve) return;
    
    try {
      setToggling(contaminationToResolve.litter_id);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('Litter')
        .update({ 
          resolved: true, 
          contamination_removed: contaminationRemoved 
        })
        .eq('litter_id', contaminationToResolve.litter_id);
      
      if (error) throw error;
      
      // Update local state
      setContaminations(prev => prev.map(contamination => 
        contamination.litter_id === contaminationToResolve.litter_id 
          ? { ...contamination, resolved: true, contamination_removed: contaminationRemoved }
          : contamination
      ));
      
      // Close modal
      setShowResolveModal(false);
      setContaminationToResolve(null);
    } catch (err) {
      console.error('Error resolving contamination:', err);
    } finally {
      setToggling(null);
    }
  };

  const showToggleConfirmation = (contamination: ContaminationRecord) => {
    setContaminationToToggle(contamination);
    setToggleToResolved(!contamination.resolved);
    setShowToggleModal(true);
  };

  const confirmToggle = async () => {
    if (!contaminationToToggle) return;
    
    try {
      setToggling(contaminationToToggle.litter_id);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('Litter')
        .update({ resolved: toggleToResolved })
        .eq('litter_id', contaminationToToggle.litter_id);
      
      if (error) throw error;
      
      // Update local state
      setContaminations(prev => prev.map(contamination => 
        contamination.litter_id === contaminationToToggle.litter_id 
          ? { ...contamination, resolved: toggleToResolved }
          : contamination
      ));
      
      // Close modal
      setShowToggleModal(false);
      setContaminationToToggle(null);
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

      // Fetch all contamination records
      const { data: contaminationsData, error: contaminationsError } = await supabase
        .from('Litter')
        .select('*')
        .order('litter_id', { ascending: false });

      if (contaminationsError) throw contaminationsError;

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

      setContaminations(contaminationsData || []);
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

  const getContaminationSummary = (contamination: ContaminationRecord) => {
    const contaminatedBins = [];
    if (contamination.bin_1_contaminated) contaminatedBins.push('Bin 1');
    if (contamination.bin_2_contaminated) contaminatedBins.push('Bin 2');
    if (contamination.bin_3_contaminated) contaminatedBins.push('Bin 3');
    if (contamination.bin_4_contaminated) contaminatedBins.push('Bin 4');
    
    const contaminationTypes = [];
    if (contamination.plastic_trash) contaminationTypes.push('Plastic');
    if (contamination.food_stickers) contaminationTypes.push('Food Stickers');
    if (contamination.prohibited_organics) contaminationTypes.push('Prohibited Organics');
    if (contamination.other_trash) contaminationTypes.push('Other');
    
    const summary = [];
    if (contaminatedBins.length > 0) summary.push(`${contaminatedBins.join(', ')} contaminated`);
    if (contaminationTypes.length > 0) summary.push(`${contaminationTypes.join(', ')} found`);
    
    return summary.length > 0 ? summary.join('; ') : 'No contamination recorded';
  };

  const handleEdit = () => {
    if (selectedContamination) {
      setEditData({ ...selectedContamination });
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
        .from('Litter')
        .update({
          bin_1_contaminated: editData.bin_1_contaminated,
          bin_2_contaminated: editData.bin_2_contaminated,
          bin_3_contaminated: editData.bin_3_contaminated,
          bin_4_contaminated: editData.bin_4_contaminated,
          plastic_trash: editData.plastic_trash,
          food_stickers: editData.food_stickers,
          prohibited_organics: editData.prohibited_organics,
          other_trash: editData.other_trash
        })
        .eq('litter_id', editData.litter_id);

      if (error) throw error;

      // Update local state
      setContaminations(prev => prev.map(contamination => 
        contamination.litter_id === editData.litter_id 
          ? editData 
          : contamination
      ));

      // Update selected contamination
      setSelectedContamination(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating contamination:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ContaminationRecord, value: string | boolean | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedContamination) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Litter')
        .delete()
        .eq('litter_id', selectedContamination.litter_id);

      if (error) throw error;

      // Update local state
      setContaminations(prev => prev.filter(contamination => 
        contamination.litter_id !== selectedContamination.litter_id
      ));

      // Close modal
      setSelectedContamination(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting contamination record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading contamination data...</div>
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
      <div className="bg-orange-100 border-4 border-orange-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-orange-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Contamination Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {contaminations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-orange-200" style={{ minWidth: '1000px' }}>
            <thead className="bg-orange-50">
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
                  Contamination Summary
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
              {contaminations.map((contamination) => {
                const submission = getSubmissionInfo(contamination.submission_id);
                return (
                  <tr key={contamination.litter_id} className="hover:bg-orange-50">
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
                        <div className="truncate" title={getContaminationSummary(contamination)}>
                          {getContaminationSummary(contamination)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {contamination.resolved ? (
                        <button
                          onClick={() => showToggleConfirmation(contamination)}
                          disabled={toggling === contamination.litter_id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {toggling === contamination.litter_id ? 'Updating...' : 'Resolved'}
                        </button>
                      ) : (
                        <button
                          onClick={() => showResolveConfirmation(contamination)}
                          disabled={toggling === contamination.litter_id}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {toggling === contamination.litter_id ? 'Resolving...' : 'Resolve'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedContamination(contamination)}
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

      {/* Contamination Details Modal */}
      {selectedContamination && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Contamination Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Contamination ID: {selectedContamination.litter_id} | Submission ID: {selectedContamination.submission_id}
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
                      setSelectedContamination(null);
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
                    {/* Contaminated Bins */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="text-lg font-semibold text-red-900 mb-4">Contaminated Bins</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bin_1_contaminated"
                            checked={editData.bin_1_contaminated || false}
                            onChange={(e) => handleInputChange('bin_1_contaminated', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bin_1_contaminated" className="text-sm font-medium text-gray-700">
                            Bin 1 Contaminated
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bin_2_contaminated"
                            checked={editData.bin_2_contaminated || false}
                            onChange={(e) => handleInputChange('bin_2_contaminated', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bin_2_contaminated" className="text-sm font-medium text-gray-700">
                            Bin 2 Contaminated
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bin_3_contaminated"
                            checked={editData.bin_3_contaminated || false}
                            onChange={(e) => handleInputChange('bin_3_contaminated', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bin_3_contaminated" className="text-sm font-medium text-gray-700">
                            Bin 3 Contaminated
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="bin_4_contaminated"
                            checked={editData.bin_4_contaminated || false}
                            onChange={(e) => handleInputChange('bin_4_contaminated', e.target.checked)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <label htmlFor="bin_4_contaminated" className="text-sm font-medium text-gray-700">
                            Bin 4 Contaminated
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Contamination Types */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="text-lg font-semibold text-orange-900 mb-4">Contamination Types</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="plastic_trash"
                            checked={editData.plastic_trash || false}
                            onChange={(e) => handleInputChange('plastic_trash', e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="plastic_trash" className="text-sm font-medium text-gray-700">
                            Plastic Trash
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="food_stickers"
                            checked={editData.food_stickers || false}
                            onChange={(e) => handleInputChange('food_stickers', e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="food_stickers" className="text-sm font-medium text-gray-700">
                            Food Stickers
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="prohibited_organics"
                            checked={editData.prohibited_organics || false}
                            onChange={(e) => handleInputChange('prohibited_organics', e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="prohibited_organics" className="text-sm font-medium text-gray-700">
                            Prohibited Organics
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="other_trash_checkbox"
                            checked={!!editData.other_trash}
                            onChange={(e) => handleInputChange('other_trash', e.target.checked ? (editData.other_trash || '') : undefined)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <label htmlFor="other_trash_checkbox" className="text-sm font-medium text-gray-700">
                            Other Trash
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Other Trash Details */}
                    {editData.other_trash && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="text-lg font-semibold text-yellow-900 mb-4">Other Trash Details</h4>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={editData.other_trash || ''}
                            onChange={(e) => handleInputChange('other_trash', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                            rows={3}
                            placeholder="Describe the other trash found"
                          />
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
                {/* Contaminated Bins */}
                <div>
                  <h4 className="text-md font-medium text-black mb-2">Contaminated Bins</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded border ${selectedContamination.bin_1_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Bin 1</p>
                      <p className={`font-semibold ${selectedContamination.bin_1_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                        {selectedContamination.bin_1_contaminated ? 'Contaminated' : 'Clean'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.bin_2_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Bin 2</p>
                      <p className={`font-semibold ${selectedContamination.bin_2_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                        {selectedContamination.bin_2_contaminated ? 'Contaminated' : 'Clean'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.bin_3_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Bin 3</p>
                      <p className={`font-semibold ${selectedContamination.bin_3_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                        {selectedContamination.bin_3_contaminated ? 'Contaminated' : 'Clean'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.bin_4_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Bin 4</p>
                      <p className={`font-semibold ${selectedContamination.bin_4_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                        {selectedContamination.bin_4_contaminated ? 'Contaminated' : 'Clean'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contamination Types */}
                <div>
                  <h4 className="text-md font-medium text-black mb-2">Contamination Types</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded border ${selectedContamination.plastic_trash ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Plastic Trash</p>
                      <p className={`font-semibold ${selectedContamination.plastic_trash ? 'text-orange-800' : 'text-gray-500'}`}>
                        {selectedContamination.plastic_trash ? 'Found' : 'Not found'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.food_stickers ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Food Stickers</p>
                      <p className={`font-semibold ${selectedContamination.food_stickers ? 'text-orange-800' : 'text-gray-500'}`}>
                        {selectedContamination.food_stickers ? 'Found' : 'Not found'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.prohibited_organics ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Prohibited Organics</p>
                      <p className={`font-semibold ${selectedContamination.prohibited_organics ? 'text-orange-800' : 'text-gray-500'}`}>
                        {selectedContamination.prohibited_organics ? 'Found' : 'Not found'}
                      </p>
                    </div>
                    <div className={`p-3 rounded border ${selectedContamination.other_trash ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-sm font-medium text-gray-700">Other Trash</p>
                      <p className={`font-semibold ${selectedContamination.other_trash ? 'text-orange-800' : 'text-gray-500'}`}>
                        {selectedContamination.other_trash ? 'Found' : 'Not found'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other Trash Details */}
                {selectedContamination.other_trash && (
                  <div>
                    <h4 className="text-md font-medium text-black mb-2">Other Trash Details</h4>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-black">{selectedContamination.other_trash}</p>
                    </div>
                  </div>
                )}


                {/* Summary */}
                <div>
                  <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium text-gray-700">Total Contaminated Bins</p>
                    <p className="text-lg font-semibold text-blue-800">
                      {[
                        selectedContamination.bin_1_contaminated,
                        selectedContamination.bin_2_contaminated,
                        selectedContamination.bin_3_contaminated,
                        selectedContamination.bin_4_contaminated
                      ].filter(Boolean).length} bins
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
       {showResolveModal && contaminationToResolve && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">
                     Confirm Contamination Resolution
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     Please review the contamination details below before marking as resolved
                   </p>
                 </div>
                 <button
                   onClick={() => {
                     setShowResolveModal(false);
                     setContaminationToResolve(null);
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
                     <p className="mt-1 text-sm text-black">{contaminationToResolve.submission_id}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Contamination ID</label>
                     <p className="mt-1 text-sm text-black">{contaminationToResolve.litter_id}</p>
                   </div>
                 </div>

                 {/* Contamination Details */}
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
                     <div className={`p-3 rounded border ${contaminationToResolve.bin_1_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bin 1</p>
                       <p className={`font-semibold ${contaminationToResolve.bin_1_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.bin_1_contaminated ? 'Contaminated' : 'Clean'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${contaminationToResolve.bin_2_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bin 2</p>
                       <p className={`font-semibold ${contaminationToResolve.bin_2_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.bin_2_contaminated ? 'Contaminated' : 'Clean'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${contaminationToResolve.bin_3_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bin 3</p>
                       <p className={`font-semibold ${contaminationToResolve.bin_3_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.bin_3_contaminated ? 'Contaminated' : 'Clean'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${contaminationToResolve.bin_4_contaminated ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Bin 4</p>
                       <p className={`font-semibold ${contaminationToResolve.bin_4_contaminated ? 'text-red-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.bin_4_contaminated ? 'Contaminated' : 'Clean'}
                       </p>
                     </div>
                   </div>
                   <div className="mt-4 grid grid-cols-2 gap-4">
                     <div className={`p-3 rounded border ${contaminationToResolve.plastic_trash ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Plastic Trash</p>
                       <p className={`font-semibold ${contaminationToResolve.plastic_trash ? 'text-orange-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.plastic_trash ? 'Found' : 'Not found'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${contaminationToResolve.food_stickers ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Food Stickers</p>
                       <p className={`font-semibold ${contaminationToResolve.food_stickers ? 'text-orange-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.food_stickers ? 'Found' : 'Not found'}
                       </p>
                     </div>
                     <div className={`p-3 rounded border ${contaminationToResolve.prohibited_organics ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                       <p className="text-sm font-medium text-gray-700">Prohibited Organics</p>
                       <p className={`font-semibold ${contaminationToResolve.prohibited_organics ? 'text-orange-800' : 'text-gray-500'}`}>
                         {contaminationToResolve.prohibited_organics ? 'Found' : 'Not found'}
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
                   {contaminationToResolve.other_trash && (
                     <div className="mt-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                       <p className="text-sm font-medium text-gray-700">Other Trash Details</p>
                       <p className="text-black">{contaminationToResolve.other_trash}</p>
                     </div>
                   )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 pt-4 border-t">
                   <button
                     onClick={() => {
                       setShowResolveModal(false);
                       setContaminationToResolve(null);
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={confirmResolve}
                     disabled={toggling === contaminationToResolve.litter_id || !contaminationRemoved}
                     className={`px-4 py-2 rounded transition-colors ${
                       toggling === contaminationToResolve.litter_id || !contaminationRemoved
                         ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                         : 'bg-green-600 text-white hover:bg-green-700'
                     }`}
                   >
                     {toggling === contaminationToResolve.litter_id 
                       ? 'Resolving...' 
                       : !contaminationRemoved
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

       {/* Toggle Status Confirmation Modal */}
       {showToggleModal && contaminationToToggle && (
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
                       ? 'Are you sure you want to mark this contamination as resolved?'
                       : 'Are you sure you want to mark this contamination as unresolved?'
                     }
                   </p>
                 </div>
                 <button
                   onClick={() => {
                     setShowToggleModal(false);
                     setContaminationToToggle(null);
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
                     <p className="mt-1 text-sm text-black">{contaminationToToggle.submission_id}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700">Contamination ID</label>
                     <p className="mt-1 text-sm text-black">{contaminationToToggle.litter_id}</p>
                   </div>
                 </div>

                 {/* Current Status */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Current Status</label>
                   <div className={`mt-1 p-3 rounded border ${contaminationToToggle.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                     <p className={`font-semibold ${contaminationToToggle.resolved ? 'text-green-800' : 'text-red-800'}`}>
                       {contaminationToToggle.resolved ? 'Resolved' : 'Unresolved'}
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
                       setContaminationToToggle(null);
                     }}
                     className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={confirmToggle}
                     disabled={toggling === contaminationToToggle.litter_id}
                     className={`px-4 py-2 rounded transition-colors ${
                       toggling === contaminationToToggle.litter_id
                         ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                         : toggleToResolved
                           ? 'bg-green-600 text-white hover:bg-green-700'
                           : 'bg-red-600 text-white hover:bg-red-700'
                     }`}
                   >
                     {toggling === contaminationToToggle.litter_id 
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
       {showDeleteConfirmation && selectedContamination && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Contamination Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this contamination record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Contamination ID: {selectedContamination.litter_id}
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
