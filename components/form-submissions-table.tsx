"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AddingMaterialTable } from "@/components/adding-material-table";
import { MeasurementsTable } from "@/components/measurements-table";
import { IssuesTable } from "@/components/issues-table";
import { MovingBinsTable } from "@/components/moving-bins-table";
import { FinishedCompostTable } from "@/components/finished-compost-table";
import { BrownsBinTable } from "@/components/browns-bin-table";
import { ContaminationTable } from "@/components/contamination-table";

interface FormSubmission {
  submission_id: number;
  timestamp: string;
  site_id: number;
  first_name: string;
  last_name: string;
  user_email: string;
  Site: {
    site_name: string;
  } | null;
}

interface Measurement {
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

interface AddingMaterial {
  bin_id: number;
  submission_id: number;
  greens_pounds?: number;
  greens_gallons?: number;
  browns_gallons?: number;
  red_line?: boolean;
  bin_type?: number;
}

interface MovingDay {
  moving_id: number;
  submission_id: number;
  move_bin1_bin2?: boolean;
  move_bin2_bin3?: boolean;
  move_bin3_bin4?: boolean;
  move_bin4_steel_bins?: boolean;
}

interface FinishedCompost {
  compost_id: number;
  submission_id: number;
  gallons_compost_taken?: number;
}

interface BrownsBin {
  browns_id: number;
  submission_id: number;
  bin_a_browns_gallons?: number;
  bin_b_browns_gallons?: number;
  bin_a_red_line?: boolean;
  bin_b_red_line?: boolean;
}

interface Issues {
  issue_id: number;
  submission_id: number;
  broken_tools?: boolean;
  bin_holes?: boolean;
  bad_odors?: boolean;
  fruit_flies_mice_other_vectors?: boolean;
  other?: string;
  litter?: boolean;
  litter_desc?: string;
}

interface Litter {
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
}

interface SubmissionWithDetails extends FormSubmission {
  measurements?: Measurement[];
  adding_material?: AddingMaterial[];
  moving_day?: MovingDay[];
  finished_compost?: FinishedCompost[];
  browns_bin?: BrownsBin[];
  issues?: Issues[];
  litter?: Litter[];
}

export function FormSubmissionsTable() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [dynamicTable, setDynamicTable] = useState<string | null>(null);
  const [autoDeleting, setAutoDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedEntryId, setHighlightedEntryId] = useState<number | null>(null);
  const [dryRunResults, setDryRunResults] = useState<{
    deletedCount: number;
    totalChecked: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch main form submissions with site names
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('Form Submission')
        .select(`
          *,
          Site(site_name)
        `)
        .order('timestamp', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Fetch related data for each submission
      const submissionsWithDetails = await Promise.all(
        (submissionsData || []).map(async (submission) => {
          const submissionId = submission.submission_id;
          
          // Fetch measurements
          const { data: measurements, error: measurementsError } = await supabase
            .from('Measurements')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch adding material
          const { data: addingMaterial, error: addingMaterialError } = await supabase
            .from('Adding Material')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch moving day
          const { data: movingDay, error: movingDayError } = await supabase
            .from('Moving Day')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch finished compost
          const { data: finishedCompost, error: finishedCompostError } = await supabase
            .from('Finished Compost')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch browns bin
          const { data: brownsBin, error: brownsBinError } = await supabase
            .from('Browns Bin')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch issues
          const { data: issues, error: issuesError } = await supabase
            .from('Issues')
            .select('*')
            .eq('submission_id', submissionId);

          // Fetch litter data
          const { data: litter, error: litterError } = await supabase
            .from('Litter')
            .select('*')
            .eq('submission_id', submissionId);

          // Log any errors for debugging
          if (measurementsError) console.error('Measurements error:', measurementsError);
          if (addingMaterialError) console.error('Adding Material error:', addingMaterialError);
          if (movingDayError) console.error('Moving Day error:', movingDayError);
          if (finishedCompostError) console.error('Finished Compost error:', finishedCompostError);
          if (brownsBinError) console.error('Browns Bin error:', brownsBinError);
          if (issuesError) console.error('Issues error:', issuesError);
          if (litterError) console.error('Litter error:', litterError);

          // Log successful data for debugging
          console.log(`Submission ${submissionId} data:`, {
            measurements: measurements?.length || 0,
            addingMaterial: addingMaterial?.length || 0,
            movingDay: movingDay?.length || 0,
            finishedCompost: finishedCompost?.length || 0,
            brownsBin: brownsBin?.length || 0,
            issues: issues?.length || 0,
            litter: litter?.length || 0
          });

          return {
            ...submission,
            site_name: submission.Site?.site_name,
            measurements: measurements || [],
            adding_material: addingMaterial || [],
            moving_day: movingDay || [],
            finished_compost: finishedCompost || [],
            browns_bin: brownsBin || [],
            issues: issues || [],
            litter: litter || [],
          };
        })
      );

      setSubmissions(submissionsWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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

  const getTaskTypes = (submission: SubmissionWithDetails) => {
    const tasks = [];
    if (submission.measurements?.length) tasks.push('Measurements');
    if (submission.adding_material?.length) tasks.push('Adding Material');
    if (submission.moving_day?.length) tasks.push('Moving Day');
    if (submission.finished_compost?.length) tasks.push('Finished Compost');
    if (submission.browns_bin?.length) tasks.push('Browns Bin');
    if (submission.litter?.length) tasks.push('Contamination');
    return tasks.join(', ');
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    // Apply search filter first
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(submission => {
        // Check individual fields
        const matchesSubmissionId = submission.submission_id.toString().includes(searchLower);
        const matchesFirstName = submission.first_name && submission.first_name.toLowerCase().includes(searchLower);
        const matchesLastName = submission.last_name && submission.last_name.toLowerCase().includes(searchLower);
        const matchesEmail = submission.user_email && submission.user_email.toLowerCase().includes(searchLower);
        const matchesSite = submission.Site?.site_name && submission.Site.site_name.toLowerCase().includes(searchLower);
        
        // Check combined full name
        const fullName = `${submission.first_name || ''} ${submission.last_name || ''}`.trim().toLowerCase();
        const matchesFullName = fullName.includes(searchLower);
        
        return matchesSubmissionId || matchesFirstName || matchesLastName || matchesEmail || matchesSite || matchesFullName;
      });
    }
    
    // Then apply task type filter
    if (!activeFilter) return filtered;
    
    switch (activeFilter) {
      case 'measurements':
        return filtered.filter(s => s.measurements?.length);
      case 'adding_material':
        return filtered.filter(s => s.adding_material?.length);
      case 'finished_compost':
        return filtered.filter(s => s.finished_compost?.length);
      case 'browns_bin':
        return filtered.filter(s => s.browns_bin?.length);
      case 'contamination':
        return filtered.filter(s => s.litter?.length);
      case 'issues':
        return filtered.filter(s => s.issues?.length);
      default:
        return filtered;
    }
  };

  const handleFilterClick = (filter: string | null) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilter(null);
    setHighlightedEntryId(null);
  };

  const navigateToSpecificEntry = (tableType: string, entryId: number) => {
    setSelectedSubmission(null);
    setDynamicTable(tableType);
    setActiveFilter(tableType);
    setHighlightedEntryId(entryId);
    // Don't set search term here - let the individual table handle the filtering
  };

  const handleDoubleClick = (tableType: string) => {
    setDynamicTable(tableType);
    // Keep the active filter highlighted when showing dynamic table
  };

  const handleAutoDelete = async () => {
    if (!confirm('Are you sure you want to delete all form submissions that have no associated task data? This action cannot be undone.')) {
      return;
    }

    try {
      setAutoDeleting(true);
      setError(null);
      
      const response = await fetch('/api/submissions/auto-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully deleted ${result.deletedCount} empty submissions`);
        // Refresh the data
        await fetchSubmissions();
      } else {
        throw new Error(result.error || 'Failed to delete submissions');
      }
    } catch (err) {
      console.error('Auto-delete error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during auto-deletion');
    } finally {
      setAutoDeleting(false);
    }
  };

  const handleDryRun = async () => {
    try {
      setAutoDeleting(true);
      setError(null);
      
      const response = await fetch('/api/submissions/auto-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true })
      });

      const result = await response.json();

      if (result.success) {
        setDryRunResults({
          deletedCount: result.deletedCount,
          totalChecked: result.totalChecked,
          message: result.message
        });
      } else {
        throw new Error(result.error || 'Failed to perform dry run');
      }
    } catch (err) {
      console.error('Dry run error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during dry run');
    } finally {
      setAutoDeleting(false);
    }
  };

  const renderDynamicTable = () => {
    switch (dynamicTable) {
      case 'adding_material':
        return <AddingMaterialTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'measurements':
        return <MeasurementsTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'issues':
        return <IssuesTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'moving_day':
        return <MovingBinsTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'finished_compost':
        return <FinishedCompostTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'browns_bin':
        return <BrownsBinTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      case 'contamination':
        return <ContaminationTable highlightedEntryId={highlightedEntryId} onEntryHighlighted={setHighlightedEntryId} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Loading Form Submissions</h3>
              <p className="text-gray-600">Please wait while we fetch your data...</p>
            </div>
          </div>
        </div>

        {/* Loading Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Loading Table Placeholder */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                  <div className="h-4 bg-gray-200 rounded w-36"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                    {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
          <button 
            onClick={() => {
              setDynamicTable(null); // Clear dynamic table
              handleFilterClick(null);
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === null && !dynamicTable ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-2xl font-bold text-cyan-600">{submissions.length}</div>
            <div className="text-gray-600">Total Submissions</div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'measurements') {
                // Second click - show dynamic table
                handleDoubleClick('measurements');
              } else {
                // First click - apply filter
                handleFilterClick('measurements');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'measurements' ? 'ring-2 ring-green-500 hover:bg-green-50' : 'hover:bg-green-50'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.measurements?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'measurements' ? 'Measurements (Click again for table)' : 'Measurements'}
            </div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'adding_material') {
                // Second click - show dynamic table
                handleDoubleClick('adding_material');
              } else {
                // First click - apply filter
                handleFilterClick('adding_material');
              }
            }}
             className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
               activeFilter === 'adding_material' ? 'ring-2 ring-purple-500 hover:bg-purple-50' : 'hover:bg-purple-50'
             }`}
           >
             <div className="text-2xl font-bold text-emerald-600">
               {submissions.filter(s => s.adding_material?.length).length}
             </div>
             <div className="text-gray-600">
               {activeFilter === 'adding_material' ? 'Adding Material (Click again for table)' : 'Adding Material'}
             </div>
                       </button>
          <button 
            onClick={() => {
              if (activeFilter === 'moving_day') {
                // Second click - show dynamic table
                handleDoubleClick('moving_day');
              } else {
                // First click - apply filter
                handleFilterClick('moving_day');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'moving_day' ? 'ring-2 ring-blue-500 hover:bg-blue-50' : 'hover:bg-blue-50'
            }`}
          >
            <div className="text-2xl font-bold text-indigo-600">
              {submissions.filter(s => s.moving_day?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'moving_day' ? 'Moving Bins (Click again for table)' : 'Moving Bins'}
            </div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'finished_compost') {
                // Second click - show dynamic table
                handleDoubleClick('finished_compost');
              } else {
                // First click - apply filter
                handleFilterClick('finished_compost');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'finished_compost' ? 'ring-2 ring-green-500 hover:bg-green-50' : 'hover:bg-green-50'
            }`}
          >
            <div className="text-2xl font-bold text-lime-600">
              {submissions.filter(s => s.finished_compost?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'finished_compost' ? 'Finished Compost (Click again for table)' : 'Finished Compost'}
            </div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'browns_bin') {
                // Second click - show dynamic table
                handleDoubleClick('browns_bin');
              } else {
                // First click - apply filter
                handleFilterClick('browns_bin');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'browns_bin' ? 'ring-2 ring-amber-500 hover:bg-amber-50' : 'hover:bg-amber-50'
            }`}
          >
            <div className="text-2xl font-bold text-amber-600">
              {submissions.filter(s => s.browns_bin?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'browns_bin' ? 'Browns Bin (Click again for table)' : 'Browns Bin'}
            </div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'contamination') {
                // Second click - show dynamic table
                handleDoubleClick('contamination');
              } else {
                // First click - apply filter
                handleFilterClick('contamination');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'contamination' ? 'ring-2 ring-orange-500 hover:bg-orange-50' : 'hover:bg-orange-50'
            }`}
          >
            <div className="text-2xl font-bold text-orange-600">
              {submissions.filter(s => s.litter?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'contamination' ? 'Contamination (Click again for table)' : 'Contamination Reports'}
            </div>
          </button>
          <button 
            onClick={() => {
              if (activeFilter === 'issues') {
                // Second click - show dynamic table
                handleDoubleClick('issues');
              } else {
                // First click - apply filter
                handleFilterClick('issues');
              }
            }}
            className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:shadow-lg ${
              activeFilter === 'issues' ? 'ring-2 ring-red-500 hover:bg-red-50' : 'hover:bg-red-50'
            }`}
          >
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter(s => s.issues?.length).length}
            </div>
            <div className="text-gray-600">
              {activeFilter === 'issues' ? 'Issues (Click again for table)' : 'Issues Reported'}
            </div>
          </button>
        </div>

        {/* Dynamic Table or Submissions Table */}
        {dynamicTable ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {dynamicTable.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Table
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {highlightedEntryId ? (
                      <span>
                        Opening specific entry (ID: {highlightedEntryId}) details...
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Loading Entry
                        </span>
                      </span>
                    ) : (
                      "Detailed view of specific data"
                    )}
                  </p>
                </div>
                {highlightedEntryId && (
                  <button
                    onClick={() => {
                      setHighlightedEntryId(null);
                      setSearchTerm('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                    title="Clear entry filter and show all entries"
                  >
                    Show All Entries
                  </button>
                )}
              </div>
            </div>
            <div className="p-0">
              {renderDynamicTable()}
            </div>
          </div>
        ) : (
          <>
             {/* Submissions Table */}
       <div className="bg-cyan-100 border-4 border-cyan-400 shadow rounded-lg overflow-hidden">
         <div className="px-6 py-4 border-b-4 border-cyan-400">
           <div className="flex justify-between items-center">
             <div className="flex items-center space-x-4">
               <h2 className="text-xl font-semibold text-gray-900">Form Submissions</h2>
               <button
                 onClick={handleDryRun}
                 disabled={loading || autoDeleting}
                 className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                 title="Check which submissions would be deleted and proceed with deletion if desired"
               >
                 {autoDeleting ? 'Checking...' : 'Clean Up Empty Submissions'}
               </button>
             </div>
             
             {/* Search Bar */}
             <div className="flex items-center space-x-4">
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <input
                   type="text"
                   placeholder="Search by ID, name, email, or site..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="block w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                 />
                 {searchTerm && (
                   <button
                     onClick={() => setSearchTerm('')}
                     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                     title="Clear search"
                   >
                     <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 )}
               </div>
               
               {searchTerm && (
                 <div className="text-sm text-gray-600">
                   {getFilteredSubmissions().length} result{getFilteredSubmissions().length !== 1 ? 's' : ''} found
                 </div>
               )}
             </div>
             {(activeFilter || searchTerm) && (
               <div className="flex items-center space-x-2">
                 {activeFilter && (
                   <>
                     <span className="text-sm text-gray-600">Filtered by:</span>
                     <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                       {activeFilter.replace('_', ' ')}
                     </span>
                   </>
                 )}
                 {searchTerm && (
                   <>
                     <span className="text-sm text-gray-600">Search:</span>
                     <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                       "{searchTerm}"
                     </span>
                   </>
                 )}
                 <button
                   onClick={clearAllFilters}
                   className="text-gray-400 hover:text-gray-600"
                   aria-label="Clear all filters"
                   title="Clear all filters and search"
                 >
                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             )}
           </div>
         </div>
        
                 <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-cyan-200" style={{ minWidth: '800px' }}>
            <thead className="bg-cyan-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   User
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Email
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Site
                 </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                   Tasks
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
               {getFilteredSubmissions().length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center">
                     <div className="flex flex-col items-center">
                       <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                       <h3 className="text-lg font-medium text-gray-900 mb-2">
                         {searchTerm ? 'No submissions found' : 'No submissions match the current filter'}
                       </h3>
                       <p className="text-gray-500">
                         {searchTerm 
                           ? `No submissions match "${searchTerm}". Try adjusting your search terms.`
                           : 'Try selecting a different filter or clear the current filter.'
                         }
                       </p>
                       {searchTerm && (
                         <button
                           onClick={() => setSearchTerm('')}
                           className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                         >
                           Clear search
                         </button>
                       )}
                     </div>
                   </td>
                 </tr>
               ) : (
                 getFilteredSubmissions().map((submission) => (
                  <tr key={submission.submission_id} className="hover:bg-cyan-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(submission.timestamp)}
                    </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {submission.first_name} {submission.last_name}
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.user_email}
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       {submission.Site?.site_name || `Site ${submission.site_id}`}
                     </td>
                                       <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                       <div className="truncate" title={getTaskTypes(submission)}>
                         {getTaskTypes(submission)}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
                             <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">
                     Submission Details - {selectedSubmission.first_name} {selectedSubmission.last_name}
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     Submission ID: {selectedSubmission.submission_id}
                   </p>
                 </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date/Time</label>
                      <p className="mt-1 text-sm text-black">{formatDate(selectedSubmission.timestamp)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site</label>
                      <p className="mt-1 text-sm text-black">{selectedSubmission.Site?.site_name || `Site ${selectedSubmission.site_id}`}</p>
                    </div>
                                         <div>
                       <label className="block text-sm font-medium text-gray-700">Email</label>
                       <p className="mt-1 text-sm text-black">{selectedSubmission.user_email}</p>
                     </div>
                  </div>

                 {/* Measurements */}
                 {selectedSubmission.measurements && selectedSubmission.measurements.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Measurements</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('measurements');
                           setActiveFilter('measurements');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                         title="View all measurements in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.measurements.map((measurement) => (
                       <div key={measurement.measurement_id} className="bg-gray-50 p-3 rounded text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             <p><strong>Bin Type:</strong> {formatBinType(measurement.bin_type)}</p>
                             {measurement.temp_left && <p><strong>Left Temp:</strong> {measurement.temp_left}°F</p>}
                             {measurement.temp_middle && <p><strong>Middle Temp:</strong> {measurement.temp_middle}°F</p>}
                             {measurement.temp_right && <p><strong>Right Temp:</strong> {measurement.temp_right}°F</p>}
                             {measurement.mix && <p><strong>Mix:</strong> {measurement.mix}</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('measurements', measurement.measurement_id)}
                             className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors ml-2"
                             title="View this specific measurement in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Adding Material */}
                 {selectedSubmission.adding_material && selectedSubmission.adding_material.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Adding Material</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('adding_material');
                           setActiveFilter('adding_material');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                         title="View all adding material entries in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.adding_material.map((material) => (
                       <div key={material.bin_id} className="bg-gray-50 p-3 rounded text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             {material.greens_pounds && <p><strong>Greens (lbs):</strong> {material.greens_pounds}</p>}
                             {material.greens_gallons && <p><strong>Greens (gallons):</strong> {material.greens_gallons}</p>}
                             {material.browns_gallons && <p><strong>Browns (gallons):</strong> {material.browns_gallons}</p>}
                             {material.red_line && <p><strong>At Red Line:</strong> {material.red_line ? 'Yes' : 'No'}</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('adding_material', material.bin_id)}
                             className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 transition-colors ml-2"
                             title="View this specific adding material entry in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Finished Compost */}
                 {selectedSubmission.finished_compost && selectedSubmission.finished_compost.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Finished Compost</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('finished_compost');
                           setActiveFilter('finished_compost');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                         title="View all finished compost entries in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.finished_compost.map((compost) => (
                       <div key={compost.compost_id} className="bg-green-50 p-3 rounded border border-green-200 text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             {compost.gallons_compost_taken && <p><strong>Gallons of Compost Taken:</strong> {compost.gallons_compost_taken}</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('finished_compost', compost.compost_id)}
                             className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors ml-2"
                             title="View this specific finished compost entry in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Browns Bin */}
                 {selectedSubmission.browns_bin && selectedSubmission.browns_bin.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Browns Bin</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('browns_bin');
                           setActiveFilter('browns_bin');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200 transition-colors"
                         title="View all browns bin entries in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.browns_bin.map((browns) => (
                       <div key={browns.browns_id} className="bg-amber-50 p-3 rounded border border-amber-200 text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             {browns.bin_a_browns_gallons && <p><strong>Bin A Browns (gallons):</strong> {browns.bin_a_browns_gallons}</p>}
                             {browns.bin_b_browns_gallons && <p><strong>Bin B Browns (gallons):</strong> {browns.bin_b_browns_gallons}</p>}
                             {browns.bin_a_red_line && <p><strong>Bin A at Red Line:</strong> {browns.bin_a_red_line ? 'Yes' : 'No'}</p>}
                             {browns.bin_b_red_line && <p><strong>Bin B at Red Line:</strong> {browns.bin_b_red_line ? 'Yes' : 'No'}</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('browns_bin', browns.browns_id)}
                             className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200 transition-colors ml-2"
                             title="View this specific browns bin entry in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Moving Day */}
                 {selectedSubmission.moving_day && selectedSubmission.moving_day.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Moving Day</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('moving_day');
                           setActiveFilter('moving_day');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                         title="View all moving day entries in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.moving_day.map((moving) => (
                       <div key={moving.moving_id} className="bg-blue-50 p-3 rounded border border-blue-200 text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             {moving.move_bin1_bin2 && <p>• Moved from Bin 1 to Bin 2</p>}
                             {moving.move_bin2_bin3 && <p>• Moved from Bin 2 to Bin 3</p>}
                             {moving.move_bin3_bin4 && <p>• Moved from Bin 3 to Bin 4</p>}
                             {moving.move_bin4_steel_bins && <p>• Moved from Bin 4 to Steel Bins</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('moving_day', moving.moving_id)}
                             className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors ml-2"
                             title="View this specific moving day entry in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Issues */}
                 {selectedSubmission.issues && selectedSubmission.issues.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Issues Reported</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('issues');
                           setActiveFilter('issues');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                         title="View all issues in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.issues.map((issue) => (
                       <div key={issue.issue_id} className="bg-red-50 p-3 rounded border border-red-200 text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             {issue.broken_tools && <p>• Broken tools</p>}
                             {issue.bin_holes && <p>• Bin holes</p>}
                             {issue.bad_odors && <p>• Bad odors</p>}
                             {issue.fruit_flies_mice_other_vectors && <p>• Fruit flies/mice/other vectors</p>}
                             {issue.other && <p>• Other: {issue.other}</p>}
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('issues', issue.issue_id)}
                             className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors ml-2"
                             title="View this specific issue in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Contamination/Litter */}
                 {selectedSubmission.litter && selectedSubmission.litter.length > 0 && (
                   <div>
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-md font-medium text-black">Contamination Assessment</h4>
                       <button
                         onClick={() => {
                           setSelectedSubmission(null);
                           setDynamicTable('contamination');
                           setActiveFilter('contamination');
                           setHighlightedEntryId(null);
                         }}
                         className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                         title="View all contamination entries in table"
                       >
                         View All in Table
                       </button>
                     </div>
                     {selectedSubmission.litter.map((litter) => (
                       <div key={litter.litter_id} className="bg-orange-50 p-3 rounded border border-orange-200 text-black">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex-1">
                             <div className="mb-2">
                               <strong>Contaminated Bins:</strong>
                               <div className="ml-4">
                                 {litter.bin_1_contaminated && <p>• Bin 1</p>}
                                 {litter.bin_2_contaminated && <p>• Bin 2</p>}
                                 {litter.bin_3_contaminated && <p>• Bin 3</p>}
                                 {litter.bin_4_contaminated && <p>• Bin 4</p>}
                               </div>
                             </div>
                             
                             <div className="mb-2">
                               <strong>Contamination Types:</strong>
                               <div className="ml-4">
                                 {litter.plastic_trash && <p>• Plastic trash</p>}
                                 {litter.food_stickers && <p>• Food stickers</p>}
                                 {litter.prohibited_organics && <p>• Prohibited organics (meat, bones, dairy, etc.)</p>}
                                 {litter.other_trash && <p>• Other: {litter.other_trash}</p>}
                               </div>
                             </div>
                             
                             <div>
                               <strong>Contamination Removed:</strong> {litter.contamination_removed ? 'Yes' : 'No'}
                             </div>
                           </div>
                           <button
                             onClick={() => navigateToSpecificEntry('contamination', litter.litter_id)}
                             className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors ml-2"
                             title="View this specific contamination entry in table"
                           >
                             View This Entry
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Dry Run Results Modal */}
      {dryRunResults && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Dry Run Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Analysis of empty form submissions
                  </p>
                </div>
                <button
                  onClick={() => setDryRunResults(null)}
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
                {/* Summary Stats */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-md font-medium text-blue-900">Analysis Complete</h4>
                  </div>
                  <p className="text-sm text-blue-800">{dryRunResults.message}</p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold text-gray-900">{dryRunResults.totalChecked}</div>
                      <div className="text-sm text-gray-600">Total Checked</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All form submissions analyzed</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl font-bold text-red-600">{dryRunResults.deletedCount}</div>
                      <div className="text-sm text-gray-600">Would Be Deleted</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Submissions with no task data</p>
                  </div>
                </div>

                {/* Details */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="text-md font-medium text-yellow-900">What This Means</h4>
                  </div>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p>• Empty submissions have no associated data in any task tables</p>
                    <p>• These include: Measurements, Adding Material, Moving Day, Finished Compost, Browns Bin, Issues, and Contamination</p>
                    <p>• Deleting them will not affect any actual task data</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setDryRunResults(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                  {dryRunResults.deletedCount > 0 && (
                    <button
                      onClick={() => {
                        setDryRunResults(null);
                        handleAutoDelete();
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Proceed with Deletion
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
          </>
        )}
    </div>
  );
}
