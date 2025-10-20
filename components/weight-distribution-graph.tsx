"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// DCCI Weight Estimation Constants
// Note: Finished compost is only reported in gallons, not converted to weight
const BUCKET_WEIGHT = 1.8; // Bucket weight in pounds (from DCCI instructions)
const BROWNS_GALLONS_TO_POUNDS = 1.2; // 1 gallon browns = 1.2 pounds (from DCCI instructions)

interface WeightData {
  date: string;
  added: number; // in pounds
  removed: number; // in gallons (finished compost volume only)
  net: number; // in pounds (added - removed gallons converted to pounds for comparison)
}

interface Site {
  site_id: number;
  site_name: string;
}

export function WeightDistributionGraph() {
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchWeightData(selectedSite);
    }
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('Site')
        .select('site_id, site_name')
        .order('site_name');

      if (error) throw error;
      setSites(data || []);
      if (data && data.length > 0) {
        setSelectedSite(data[0].site_id);
      }
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites. Please refresh the page.');
    }
  };

  const fetchWeightData = async (siteId: number) => {
    if (!siteId) return;
    
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Fetch form submissions for the specific site first
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('Form Submission')
        .select('submission_id, timestamp, site_id')
        .eq('site_id', siteId)
        .order('timestamp', { ascending: false })
        .limit(500); // Increased limit to get more historical data

      if (submissionsError) {
        console.error('Error fetching submissions data:', submissionsError);
        throw submissionsError;
      }

      if (!submissionsData || submissionsData.length === 0) {
        setWeightData([]);
        return;
      }

      const submissionIds = submissionsData.map(s => s.submission_id);

      // Fetch adding material data for this site's submissions only
      const { data: addingData, error: addingError } = await supabase
        .from('Adding Material')
        .select('*')
        .in('submission_id', submissionIds)
        .order('bin_id', { ascending: false });

      // Fetch browns bin data for this site's submissions only
      const { data: brownsData, error: brownsError } = await supabase
        .from('Browns Bin')
        .select('*')
        .in('submission_id', submissionIds)
        .order('browns_id', { ascending: false });

      // Fetch finished compost data for this site's submissions only
      const { data: compostData, error: compostError } = await supabase
        .from('Finished Compost')
        .select('*')
        .in('submission_id', submissionIds)
        .order('compost_id', { ascending: false });

      if (addingError) {
        console.error('Error fetching adding material data:', addingError);
        throw addingError;
      }
      if (brownsError) {
        console.error('Error fetching browns data:', brownsError);
        throw brownsError;
      }
      if (compostError) {
        console.error('Error fetching compost data:', compostError);
        throw compostError;
      }

      console.log('Adding data:', addingData);
      console.log('Browns data:', brownsData);
      console.log('Compost data:', compostData);
      console.log('Submissions data:', submissionsData);

      // Group by date and sum weights using DCCI's accurate methods
      const groupedData = submissionsData.reduce((acc, submission) => {
        const date = new Date(submission.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { added: 0, removed: 0, greensDropoffs: 0, brownsDropoffs: 0 };
        }
        
        // Process adding material records (greens) with DCCI bucket adjustment
        const addingRecords = addingData?.filter(record => record.submission_id === submission.submission_id) || [];
        addingRecords.forEach(record => {
          if (record.greens_pounds && record.greens_pounds > 0) {
            // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
            const greensWithBucketAdjustment = Math.max(0, record.greens_pounds - BUCKET_WEIGHT);
            acc[date].added += greensWithBucketAdjustment;
            acc[date].greensDropoffs += 1;
          }
        });

        // Process browns bin records with DCCI conversion and bucket adjustment
        const brownsRecords = brownsData?.filter(record => record.submission_id === submission.submission_id) || [];
        brownsRecords.forEach(record => {
          const brownsGallons = (record.bin_a_browns_gallons || 0) + (record.bin_b_browns_gallons || 0);
          if (brownsGallons > 0) {
            // DCCI method: (gallons × 1.2) - bucket weight
            const brownsWeight = Math.max(0, (brownsGallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
            acc[date].added += brownsWeight;
            acc[date].brownsDropoffs += 1;
          }
        });

        // Process finished compost records
        const compostRecords = compostData?.filter(record => record.submission_id === submission.submission_id) || [];
        compostRecords.forEach(record => {
          if (record.gallons_compost_taken && record.gallons_compost_taken > 0) {
            // Store finished compost volume in gallons (no weight conversion)
            acc[date].removed += record.gallons_compost_taken;
          }
        });

        return acc;
      }, {} as Record<string, { added: number; removed: number; greensDropoffs: number; brownsDropoffs: number }>);

      // Convert to array and sort by date
      const processedData: WeightData[] = Object.entries(groupedData)
        .map(([date, weights]) => ({
          date,
          added: weights.added,
          removed: weights.removed, // in gallons
          net: weights.added - (weights.removed * 8.34) // Convert removed gallons to pounds for net calculation
        }))
        .filter(day => day.added > 0 || day.removed > 0) // Only include days with activity
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log('Processed weight data:', processedData);
      setWeightData(processedData);

    } catch (err) {
      console.error('Error fetching weight data:', err);
      setError('Failed to load weight data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedSiteName = sites.find(s => s.site_id === selectedSite)?.site_name || 'Unknown Site';

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{selectedSiteName}</h3>
          <select
            value={selectedSite || ''}
            onChange={(e) => setSelectedSite(Number(e.target.value))}
            className="px-4 py-2 border border-white rounded-lg text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
            title="Select site to view weight distribution"
            aria-label="Select site to view weight distribution"
          >
            {sites.map((site) => (
              <option key={site.site_id} value={site.site_id}>
                {site.site_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-6">
        {error ? (
          <div className="text-center text-red-600 py-8">
            <div className="mb-2">⚠️ {error}</div>
            <button 
              onClick={() => selectedSite && fetchWeightData(selectedSite)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500 py-8">
            Loading weight data...
          </div>
        ) : weightData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No weight data available for this site
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart representation */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Weight Distribution (All Time)</h4>
              <div className="text-xs text-gray-500 mb-2">
                Showing {weightData.length} days of activity • Scroll to see more
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                {weightData.map((data, index) => (
                  <div key={data.date} className="flex items-center space-x-2">
                    <div className="w-16 text-xs text-gray-500">
                      {new Date(data.date).toLocaleDateString()}
                    </div>
                    <div className="flex-1 flex space-x-1">
                      {data.added > 0 && (
                        <div
                          className="bg-green-500 h-4 rounded"
                          style={{ width: `${Math.min((data.added / 50) * 100, 100)}%` }}
                          title={`Added: ${data.added} lbs`}
                        />
                      )}
                      {data.removed > 0 && (
                        <div
                          className="bg-red-500 h-4 rounded"
                          style={{ width: `${Math.min((data.removed / 50) * 100, 100)}%` }}
                          title={`Removed: ${data.removed} gallons`}
                        />
                      )}
                    </div>
                    <div className="w-20 text-xs text-gray-600">
                      Net: {data.net > 0 ? '+' : ''}{data.net.toFixed(1)} lbs
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Added</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Removed</span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {weightData.reduce((sum, d) => sum + d.added, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Total Added (lbs)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {weightData.reduce((sum, d) => sum + d.removed, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Total Removed (lbs)</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  weightData.reduce((sum, d) => sum + d.net, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weightData.reduce((sum, d) => sum + d.net, 0) >= 0 ? '+' : ''}
                  {weightData.reduce((sum, d) => sum + d.net, 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Net Change (lbs)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
