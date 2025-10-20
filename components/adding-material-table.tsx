"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface AddingMaterialRecord {
  bin_id: number;
  submission_id: number;
  greens_pounds?: number;
  greens_gallons?: number;
  browns_gallons?: number;
  red_line?: boolean;
  bin_type?: number;
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

interface AddingMaterialTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function AddingMaterialTable({ highlightedEntryId, onEntryHighlighted }: AddingMaterialTableProps = {}) {
  const [materials, setMaterials] = useState<AddingMaterialRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<AddingMaterialRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AddingMaterialRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && materials.length > 0) {
      const targetMaterial = materials.find(m => m.bin_id === highlightedEntryId);
      if (targetMaterial) {
        setSelectedMaterial(targetMaterial);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, materials, onEntryHighlighted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

                    // Fetch all adding material records
       const { data: materialsData, error: materialsError } = await supabase
         .from('Adding Material')
         .select('*')
         .order('bin_id', { ascending: false });

       if (materialsError) throw materialsError;

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

      setMaterials(materialsData || []);
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

  const formatBinType = (binType: number | undefined) => {
    if (!binType) return 'N/A';
    return `Bin ${binType}`;
  };

  const handleEdit = () => {
    if (selectedMaterial) {
      setEditData({ ...selectedMaterial });
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
        .from('Adding Material')
        .update({
          greens_pounds: editData.greens_pounds,
          greens_gallons: editData.greens_gallons,
          browns_gallons: editData.browns_gallons,
          red_line: editData.red_line,
          bin_type: editData.bin_type
        })
        .eq('bin_id', editData.bin_id);

      if (error) throw error;

      // Update local state
      setMaterials(prev => prev.map(material => 
        material.bin_id === editData.bin_id 
          ? editData 
          : material
      ));

      // Update selected material
      setSelectedMaterial(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating adding material:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AddingMaterialRecord, value: string | number | boolean | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Adding Material')
        .delete()
        .eq('bin_id', selectedMaterial.bin_id);

      if (error) throw error;

      // Update local state
      setMaterials(prev => prev.filter(material => 
        material.bin_id !== selectedMaterial.bin_id
      ));

      // Close modal
      setSelectedMaterial(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting material record:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading adding material data...</div>
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
      <div className="bg-emerald-100 border-4 border-emerald-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-emerald-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Adding Material Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {materials.length}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-200" style={{ minWidth: '1000px' }}>
                         <thead className="bg-emerald-50">
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
                  Bin Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Greens (lbs)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Greens (gallons)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Browns (gallons)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  At Red Line
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                             {materials.map((material) => {
                 const submission = getSubmissionInfo(material.submission_id);
                 return (
                   <tr key={material.bin_id} className="hover:bg-emerald-50">
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
                      {formatBinType(material.bin_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.greens_pounds || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.greens_gallons || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {material.browns_gallons || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        material.red_line 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {material.red_line ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedMaterial(material)}
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

      {/* Adding Material Details Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Adding Material Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Bin ID: {selectedMaterial.bin_id} | Submission ID: {selectedMaterial.submission_id}
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
                      setSelectedMaterial(null);
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
                    {/* Basic Information */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="text-lg font-semibold text-green-900 mb-4">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bin Type</label>
                          <select
                            value={editData.bin_type || ''}
                            onChange={(e) => handleInputChange('bin_type', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                          >
                            <option value="">Select bin type</option>
                            <option value="1">Bin 1</option>
                            <option value="2">Bin 2</option>
                            <option value="3">Bin 3</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">At Red Line</label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="red_line"
                              checked={editData.red_line || false}
                              onChange={(e) => handleInputChange('red_line', e.target.checked)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label htmlFor="red_line" className="text-sm font-medium text-gray-700">
                              Bin is at red line
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Material Quantities */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">Material Quantities</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Greens (pounds)</label>
                          <input
                            type="number"
                            value={editData.greens_pounds || ''}
                            onChange={(e) => handleInputChange('greens_pounds', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter pounds"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Greens (gallons)</label>
                          <input
                            type="number"
                            value={editData.greens_gallons || ''}
                            onChange={(e) => handleInputChange('greens_gallons', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter gallons"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Browns (gallons)</label>
                          <input
                            type="number"
                            value={editData.browns_gallons || ''}
                            onChange={(e) => handleInputChange('browns_gallons', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter gallons"
                            min="0"
                            step="0.1"
                          />
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
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Basic Information</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-gray-700">Bin Type</p>
                          <p className="text-black font-semibold">{formatBinType(selectedMaterial.bin_type)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Material Quantities */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Material Quantities</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Greens (pounds)</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {selectedMaterial.greens_pounds ? `${selectedMaterial.greens_pounds} lbs` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Greens (gallons)</p>
                          <p className="text-lg font-semibold text-blue-800">
                            {selectedMaterial.greens_gallons ? `${selectedMaterial.greens_gallons} gal` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Browns (gallons)</p>
                          <p className="text-lg font-semibold text-amber-800">
                            {selectedMaterial.browns_gallons ? `${selectedMaterial.browns_gallons} gal` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Status</h4>
                      <div className={`p-3 rounded border ${selectedMaterial.red_line ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-sm font-medium text-gray-700">At Red Line</p>
                        <p className={`font-semibold ${selectedMaterial.red_line ? 'text-red-800' : 'text-green-800'}`}>
                          {selectedMaterial.red_line ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Summary</h4>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Total Material Added</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {[
                            selectedMaterial.greens_pounds ? `${selectedMaterial.greens_pounds} lbs greens` : null,
                            selectedMaterial.greens_gallons ? `${selectedMaterial.greens_gallons} gal greens` : null,
                            selectedMaterial.browns_gallons ? `${selectedMaterial.browns_gallons} gal browns` : null
                          ].filter(Boolean).join(', ') || 'No quantities recorded'}
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
       {showDeleteConfirmation && selectedMaterial && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Adding Material Record</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this adding material record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Bin ID: {selectedMaterial.bin_id}
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
