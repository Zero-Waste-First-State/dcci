"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface MeasurementRecord {
  measurement_id: number;
  submission_id: number;
  bin_type: string;
  temp_left?: number;
  temp_middle?: number;
  temp_right?: number;
  left_squeeze?: string;
  middle_squeeze?: string;
  right_squeeze?: string;
  left_corrective_actions?: string;
  middle_corrective_actions?: string;
  right_corrective_actions?: string;
  mix?: string;
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

interface MeasurementsTableProps {
  highlightedEntryId?: number | null;
  onEntryHighlighted?: (id: number | null) => void;
}

export function MeasurementsTable({ highlightedEntryId, onEntryHighlighted }: MeasurementsTableProps = {}) {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState<MeasurementRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<MeasurementRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-open details modal for highlighted entry
  useEffect(() => {
    if (highlightedEntryId && measurements.length > 0) {
      const targetMeasurement = measurements.find(m => m.measurement_id === highlightedEntryId);
      if (targetMeasurement) {
        setSelectedMeasurement(targetMeasurement);
        // Clear the highlight after opening
        if (onEntryHighlighted) {
          onEntryHighlighted(null);
        }
      }
    }
  }, [highlightedEntryId, measurements, onEntryHighlighted]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch all measurement records
      const { data: measurementsData, error: measurementsError } = await supabase
        .from('Measurements')
        .select('*')
        .order('measurement_id', { ascending: false });

      if (measurementsError) throw measurementsError;

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

      setMeasurements(measurementsData || []);
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

  const formatBinType = (binType: string) => {
    if (!binType) return 'N/A';
    
    // Handle special cases
    if (binType === 'steel_bins') return 'Steel Bins';
    
    // For bin_1, bin_2, etc., convert to "Bin 1", "Bin 2", etc.
    if (binType.startsWith('bin_')) {
      const binNumber = binType.replace('bin_', '');
      return `Bin ${binNumber}`;
    }
    
    // For any other cases, capitalize first letter of each word
    return binType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleEdit = () => {
    if (selectedMeasurement) {
      setEditData({ ...selectedMeasurement });
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
        .from('Measurements')
        .update({
          bin_type: editData.bin_type,
          temp_left: editData.temp_left,
          temp_middle: editData.temp_middle,
          temp_right: editData.temp_right,
          left_squeeze: editData.left_squeeze,
          middle_squeeze: editData.middle_squeeze,
          right_squeeze: editData.right_squeeze,
          left_corrective_actions: editData.left_corrective_actions,
          middle_corrective_actions: editData.middle_corrective_actions,
          right_corrective_actions: editData.right_corrective_actions,
          mix: editData.mix
        })
        .eq('measurement_id', editData.measurement_id);

      if (error) throw error;

      // Update local state
      setMeasurements(prev => prev.map(measurement => 
        measurement.measurement_id === editData.measurement_id 
          ? editData 
          : measurement
      ));

      // Update selected measurement
      setSelectedMeasurement(editData);

      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error('Error updating measurement:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof MeasurementRecord, value: string | number | undefined) => {
    if (editData) {
      setEditData(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  const handleDelete = async () => {
    if (!selectedMeasurement) return;

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from('Measurements')
        .delete()
        .eq('measurement_id', selectedMeasurement.measurement_id);

      if (error) throw error;

      // Update local state
      setMeasurements(prev => prev.filter(measurement => 
        measurement.measurement_id !== selectedMeasurement.measurement_id
      ));

      // Close modal
      setSelectedMeasurement(null);
      setIsEditing(false);
      setEditData(null);
      setShowDeleteConfirmation(false);
    } catch (err) {
      console.error('Error deleting measurement:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  const isFieldEditable = (field: string) => {
    if (!editData) return false;
    
    const binType = editData.bin_type;
    
    // Bin 4: Only middle temp, middle squeeze, and middle corrective actions
    if (binType === 'bin_4') {
      return ['temp_middle', 'middle_squeeze', 'middle_corrective_actions'].includes(field);
    }
    
    // Steel bins: Only middle squeeze and middle corrective actions
    if (binType === 'steel_bins') {
      return ['middle_squeeze', 'middle_corrective_actions'].includes(field);
    }
    
    // All other bin types: All fields are editable
    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading measurements data...</div>
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
      <div className="bg-green-100 border-4 border-green-400 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b-4 border-green-400">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Measurements Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Records: {measurements.length}
              </p>
            </div>
          </div>
        </div>

                 {/* Table */}
         <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-green-200" style={{ minWidth: '1000px' }}>
             <thead className="bg-green-50">
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
                   Left Temp (°F)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Middle Temp (°F)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Right Temp (°F)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Actions
                 </th>
               </tr>
             </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {measurements.map((measurement) => {
                const submission = getSubmissionInfo(measurement.submission_id);
                return (
                  <tr key={measurement.measurement_id} className="hover:bg-green-50">
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
                      {formatBinType(measurement.bin_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {measurement.temp_left ? `${measurement.temp_left}°F` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {measurement.temp_middle ? `${measurement.temp_middle}°F` : 'N/A'}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {measurement.temp_right ? `${measurement.temp_right}°F` : 'N/A'}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <button
                         onClick={() => setSelectedMeasurement(measurement)}
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

       {/* Measurement Details Modal */}
       {selectedMeasurement && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
             <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Measurement Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Measurement ID: {selectedMeasurement.measurement_id} | Submission ID: {selectedMeasurement.submission_id}
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
                      setSelectedMeasurement(null);
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
                    {/* Basic Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bin Type</label>
                          <select
                            value={editData.bin_type}
                            onChange={(e) => handleInputChange('bin_type', e.target.value)}
                            disabled={editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins'}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              (editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins') 
                                ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' 
                                : 'border-gray-300 focus:ring-blue-500 bg-white'
                            }`}
                          >
                            <option value="bin_1" disabled={editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins'}>Bin 1</option>
                            <option value="bin_2" disabled={editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins'}>Bin 2</option>
                            <option value="bin_3" disabled={editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins'}>Bin 3</option>
                            <option value="bin_4" disabled={!!(editData.bin_type && editData.bin_type !== 'bin_4' && editData.bin_type !== '')}>Bin 4 (Curing Pile)</option>
                            <option value="steel_bins" disabled={!!(editData.bin_type && editData.bin_type !== 'steel_bins' && editData.bin_type !== '')}>Steel Bins</option>
                          </select>
                          {(editData.bin_type === 'bin_4' || editData.bin_type === 'steel_bins') && (
                            <p className="text-xs text-gray-500 mt-1">
                              Bin type cannot be changed for {editData.bin_type === 'bin_4' ? 'Bin 4' : 'Steel Bins'}
                            </p>
                          )}
                          {editData.bin_type && editData.bin_type !== 'bin_4' && editData.bin_type !== 'steel_bins' && editData.bin_type !== '' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Cannot switch to Bin 4 or Steel Bins from regular bins
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Mix</label>
                          <select
                            value={editData.mix || ''}
                            onChange={(e) => handleInputChange('mix', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="Mixed while adding">Mixed while adding</option>
                            <option value="Mixed within Bin">Mixed within Bin</option>
                            <option value="No mixing">No mixing</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Field Availability Info */}
                      <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                        <p className="text-sm text-blue-800 font-medium mb-2">Field Availability by Bin Type:</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p><strong>Bin 1, 2, 3:</strong> All fields editable, can switch between each other</p>
                          <p><strong>Bin 4:</strong> Only middle temperature, middle squeeze, and middle corrective actions</p>
                          <p><strong>Steel Bins:</strong> Only middle squeeze and middle corrective actions</p>
                          <p><strong>Note:</strong> Cannot switch between regular bins (1,2,3) and special bins (4, Steel)</p>
                        </div>
                      </div>
                    </div>

                    {/* Temperature Readings */}
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="text-lg font-semibold text-red-900 mb-4">Temperature Readings (°F)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Left Temperature
                            {!isFieldEditable('temp_left') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <input
                            type="number"
                            value={editData.temp_left || ''}
                            onChange={(e) => handleInputChange('temp_left', e.target.value ? parseFloat(e.target.value) : undefined)}
                            disabled={!isFieldEditable('temp_left')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('temp_left') 
                                ? 'border-gray-300 focus:ring-red-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            placeholder={isFieldEditable('temp_left') ? "Enter temperature" : "Not applicable"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Temperature</label>
                          <input
                            type="number"
                            value={editData.temp_middle || ''}
                            onChange={(e) => handleInputChange('temp_middle', e.target.value ? parseFloat(e.target.value) : undefined)}
                            disabled={!isFieldEditable('temp_middle')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('temp_middle') 
                                ? 'border-gray-300 focus:ring-red-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            placeholder={isFieldEditable('temp_middle') ? "Enter temperature" : "Not applicable"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Right Temperature
                            {!isFieldEditable('temp_right') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <input
                            type="number"
                            value={editData.temp_right || ''}
                            onChange={(e) => handleInputChange('temp_right', e.target.value ? parseFloat(e.target.value) : undefined)}
                            disabled={!isFieldEditable('temp_right')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('temp_right') 
                                ? 'border-gray-300 focus:ring-red-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            placeholder={isFieldEditable('temp_right') ? "Enter temperature" : "Not applicable"}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Squeeze Tests */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="text-lg font-semibold text-green-900 mb-4">Squeeze Tests</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Left Squeeze
                            {!isFieldEditable('left_squeeze') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <select
                            value={editData.left_squeeze || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditData(prev => prev ? {
                                ...prev,
                                left_squeeze: newValue,
                                // Clear corrective actions if changing to "Good"
                                left_corrective_actions: newValue === "Good" ? "" : prev.left_corrective_actions
                              } : null);
                            }}
                            disabled={!isFieldEditable('left_squeeze')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('left_squeeze') 
                                ? 'border-gray-300 focus:ring-green-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <option value="">{isFieldEditable('left_squeeze') ? 'Select squeeze test' : 'Not applicable'}</option>
                            <option value="Good">Good</option>
                            <option value="Too Wet">Too Wet</option>
                            <option value="Too Dry">Too Dry</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Squeeze</label>
                          <select
                            value={editData.middle_squeeze || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditData(prev => prev ? {
                                ...prev,
                                middle_squeeze: newValue,
                                // Clear corrective actions if changing to "Good"
                                middle_corrective_actions: newValue === "Good" ? "" : prev.middle_corrective_actions
                              } : null);
                            }}
                            disabled={!isFieldEditable('middle_squeeze')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('middle_squeeze') 
                                ? 'border-gray-300 focus:ring-green-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <option value="">{isFieldEditable('middle_squeeze') ? 'Select squeeze test' : 'Not applicable'}</option>
                            <option value="Good">Good</option>
                            <option value="Too Wet">Too Wet</option>
                            <option value="Too Dry">Too Dry</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Right Squeeze
                            {!isFieldEditable('right_squeeze') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <select
                            value={editData.right_squeeze || ''}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditData(prev => prev ? {
                                ...prev,
                                right_squeeze: newValue,
                                // Clear corrective actions if changing to "Good"
                                right_corrective_actions: newValue === "Good" ? "" : prev.right_corrective_actions
                              } : null);
                            }}
                            disabled={!isFieldEditable('right_squeeze')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('right_squeeze') 
                                ? 'border-gray-300 focus:ring-green-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <option value="">{isFieldEditable('right_squeeze') ? 'Select squeeze test' : 'Not applicable'}</option>
                            <option value="Good">Good</option>
                            <option value="Too Wet">Too Wet</option>
                            <option value="Too Dry">Too Dry</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Corrective Actions */}
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-900 mb-4">Corrective Actions</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Left Corrective Actions
                            {!isFieldEditable('left_corrective_actions') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <textarea
                            value={editData.left_corrective_actions || ''}
                            onChange={(e) => handleInputChange('left_corrective_actions', e.target.value)}
                            disabled={!isFieldEditable('left_corrective_actions')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('left_corrective_actions') 
                                ? 'border-gray-300 focus:ring-amber-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            rows={3}
                            placeholder={isFieldEditable('left_corrective_actions') ? "Enter corrective actions" : "Not applicable"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Corrective Actions</label>
                          <textarea
                            value={editData.middle_corrective_actions || ''}
                            onChange={(e) => handleInputChange('middle_corrective_actions', e.target.value)}
                            disabled={!isFieldEditable('middle_corrective_actions')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('middle_corrective_actions') 
                                ? 'border-gray-300 focus:ring-amber-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            rows={3}
                            placeholder={isFieldEditable('middle_corrective_actions') ? "Enter corrective actions" : "Not applicable"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Right Corrective Actions
                            {!isFieldEditable('right_corrective_actions') && <span className="text-xs text-gray-500 ml-1">(Not applicable)</span>}
                          </label>
                          <textarea
                            value={editData.right_corrective_actions || ''}
                            onChange={(e) => handleInputChange('right_corrective_actions', e.target.value)}
                            disabled={!isFieldEditable('right_corrective_actions')}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                              isFieldEditable('right_corrective_actions') 
                                ? 'border-gray-300 focus:ring-amber-500 bg-white' 
                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                            rows={3}
                            placeholder={isFieldEditable('right_corrective_actions') ? "Enter corrective actions" : "Not applicable"}
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
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Basic Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-gray-700">Bin Type</p>
                          <p className="text-black font-semibold">{formatBinType(selectedMeasurement.bin_type)}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-sm font-medium text-gray-700">Mix</p>
                          <p className="text-black font-semibold">{selectedMeasurement.mix || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Temperature Readings */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Temperature Readings</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700">Left Temperature</p>
                          <p className="text-lg font-semibold text-black">
                            {selectedMeasurement.temp_left ? `${selectedMeasurement.temp_left}°F` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700">Middle Temperature</p>
                          <p className="text-lg font-semibold text-black">
                            {selectedMeasurement.temp_middle ? `${selectedMeasurement.temp_middle}°F` : 'N/A'}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium text-gray-700">Right Temperature</p>
                          <p className="text-lg font-semibold text-black">
                            {selectedMeasurement.temp_right ? `${selectedMeasurement.temp_right}°F` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Squeeze Tests */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Squeeze Tests</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Left Squeeze</p>
                          <p className="text-black">{selectedMeasurement.left_squeeze || 'N/A'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Middle Squeeze</p>
                          <p className="text-black">{selectedMeasurement.middle_squeeze || 'N/A'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-sm font-medium text-gray-700">Right Squeeze</p>
                          <p className="text-black">{selectedMeasurement.right_squeeze || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Corrective Actions */}
                    <div>
                      <h4 className="text-md font-medium text-black mb-2">Corrective Actions</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Left Corrective Actions</p>
                          <p className="text-black">{selectedMeasurement.left_corrective_actions || 'None recorded'}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Middle Corrective Actions</p>
                          <p className="text-black">{selectedMeasurement.middle_corrective_actions || 'None recorded'}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded border border-amber-200">
                          <p className="text-sm font-medium text-gray-700">Right Corrective Actions</p>
                          <p className="text-black">{selectedMeasurement.right_corrective_actions || 'None recorded'}</p>
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
       {showDeleteConfirmation && selectedMeasurement && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[70]">
           <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                 <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               <div className="mt-2 text-center">
                 <h3 className="text-lg font-medium text-gray-900">Delete Measurement</h3>
                 <div className="mt-2 px-7 py-3">
                   <p className="text-sm text-gray-500">
                     Are you sure you want to delete this measurement record? This action cannot be undone.
                   </p>
                   <div className="mt-3 text-xs text-gray-400">
                     Measurement ID: {selectedMeasurement.measurement_id}
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
