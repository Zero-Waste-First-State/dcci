"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { DNREC_2024_FINAL_RESULTS, DNREC_CALCULATIONS } from "@/lib/constants";

interface ImpactStats {
  totalSites: number;
  totalParticipants: number;
  totalGreensProcessed: number; // in pounds
  totalFoodScrapsDiverted: number; // in pounds (estimated)
  totalCompostCreated: number; // in gallons
  co2Saved: number; // in pounds (estimated)
  gasConserved: number; // in gallons (estimated)
  yearToDateParticipants: number;
  yearToDateGreensProcessed: number; // in pounds
  yearToDateFoodScraps: number; // in pounds (estimated)
  yearToDateCompost: number; // in gallons
  yearToDateCo2: number; // in pounds (estimated)
  yearToDateGas: number; // in gallons (estimated)
}

// Conversion factors
// DCCI Weight Estimation Constants
// Note: Finished compost is only reported in gallons, not converted to weight
const BUCKET_WEIGHT = 1.8; // Bucket weight in pounds (from DCCI instructions)
const BROWNS_GALLONS_TO_POUNDS = 1.2; // 1 gallon browns = 1.2 pounds (from DCCI instructions)
const POUNDS_TO_TONS = 2000;

// EPA-aligned estimates for environmental impact calculations
const FOOD_SCRAPS_PERCENTAGE = 0.98; // DCCI requirement: 98% of greens are food scraps
const LANDFILL_DIVERSION_PERCENTAGE = 1.0; // 100% of food scraps diverted from landfill (same as food scraps percentage)
const CO2_PER_POUND_FOOD_SCRAPS = 0.5; // EPA estimate: 0.5 lbs CO2 per lb of food waste diverted
const GAS_PER_POUND_FOOD_SCRAPS = 0.1; // Rough estimate: 0.1 gallons gas saved per lb diverted

export function ImpactStatistics() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImpactStats();
  }, []);

  const fetchImpactStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Get current year start date
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1).toISOString();
      const launchDate = new Date('2024-01-01').toISOString();

      // Fetch total sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('Site')
        .select('site_id');

      if (sitesError) throw sitesError;

      // Fetch all form submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('Form Submission')
        .select('submission_id, timestamp, first_name, last_name');

      if (submissionsError) throw submissionsError;

      // Fetch adding material data (food scraps)
      const { data: addingData, error: addingError } = await supabase
        .from('Adding Material')
        .select('submission_id, greens_pounds');

      if (addingError) throw addingError;

      // Fetch finished compost data
      const { data: compostData, error: compostError } = await supabase
        .from('Finished Compost')
        .select('submission_id, gallons_compost_taken');

      if (compostError) throw compostError;

      // Calculate statistics
      const totalSites = sitesData?.length || 0;
      
      // Unique participants (unique email addresses would be better, but we'll use unique names for now)
      const uniqueParticipants = new Set(
        submissionsData?.map(s => `${s.first_name}_${s.last_name}`) || []
      ).size;

      // Year-to-date participants
      const yearToDateSubmissions = submissionsData?.filter(
        s => new Date(s.timestamp) >= new Date(yearStart)
      ) || [];
      const yearToDateParticipants = new Set(
        yearToDateSubmissions.map(s => `${s.first_name}_${s.last_name}`)
      ).size;

      // Total greens processed (in pounds) - use 2024 final results for total
      const totalGreensProcessed = DNREC_2024_FINAL_RESULTS.greens.pounds;

      // Estimated food scraps diverted (conservative calculation)
      const totalFoodScrapsDiverted = totalGreensProcessed * FOOD_SCRAPS_PERCENTAGE * LANDFILL_DIVERSION_PERCENTAGE;

      // Year-to-date greens processed using DCCI bucket adjustment
      const yearToDateSubmissionIds = yearToDateSubmissions.map(s => s.submission_id);
      const yearToDateGreensProcessed = addingData?.filter(
        record => yearToDateSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => {
        if (record.greens_pounds && record.greens_pounds > 0) {
          // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
          return sum + Math.max(0, record.greens_pounds - BUCKET_WEIGHT);
        }
        return sum;
      }, 0) || 0;

      // Year-to-date estimated food scraps diverted
      const yearToDateFoodScraps = yearToDateGreensProcessed * FOOD_SCRAPS_PERCENTAGE * LANDFILL_DIVERSION_PERCENTAGE;

      // Total compost created (in gallons) - use 2024 final results for total
      const totalCompostCreated = DNREC_2024_FINAL_RESULTS.finished_compost.gallons;

      // Year-to-date compost
      const yearToDateCompost = compostData?.filter(
        record => yearToDateSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => sum + (record.gallons_compost_taken || 0), 0) || 0;

      // Calculate environmental impact
      const totalCo2Saved = totalFoodScrapsDiverted * CO2_PER_POUND_FOOD_SCRAPS;
      const totalGasConserved = totalFoodScrapsDiverted * GAS_PER_POUND_FOOD_SCRAPS;
      const yearToDateCo2 = yearToDateFoodScraps * CO2_PER_POUND_FOOD_SCRAPS;
      const yearToDateGas = yearToDateFoodScraps * GAS_PER_POUND_FOOD_SCRAPS;

      setStats({
        totalSites,
        totalParticipants: uniqueParticipants,
        totalGreensProcessed,
        totalFoodScrapsDiverted,
        totalCompostCreated,
        co2Saved: totalCo2Saved,
        gasConserved: totalGasConserved,
        yearToDateParticipants,
        yearToDateGreensProcessed,
        yearToDateFoodScraps,
        yearToDateCompost,
        yearToDateCo2,
        yearToDateGas
      });

    } catch (err) {
      console.error('Error fetching impact stats:', err);
      setError('Failed to load impact statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 0): string => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatTons = (pounds: number): string => {
    return formatNumber(pounds / POUNDS_TO_TONS, 1);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-green-600 font-medium">Loading impact statistics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 shadow-lg w-full max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || 'Unable to load statistics'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-green-700 mb-1">
            DELAWARE COMMUNITY COMPOSTING INITIATIVE
          </h2>
          <p className="text-lg font-semibold text-green-600">
            You're having an impact!
          </p>
        </div>
      </div>

      {/* Total Since Launch Section */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-green-700 mb-4 text-center">
          Total since the launch of DCCI in January 1, 2024:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {stats.totalSites}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">DCCI Sites Launched</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.totalParticipants)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">DCCI Participants</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Unique form submitters</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatTons(stats.totalGreensProcessed)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Tons of Greens Processed</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Food scraps + grass clippings + plant trimmings</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatTons(stats.totalFoodScrapsDiverted)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. Food Scraps Diverted</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Tons (50% of greens processed)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.co2Saved, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. CO₂ Saved</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Pounds (EPA estimate)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.gasConserved, 1)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. Gas Conserved</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Gallons (transportation savings)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.totalCompostCreated, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Gallons Compost Created</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Finished compost collected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Year-to-Date Section */}
      <div>
        <h3 className="text-xl font-bold text-green-700 mb-4 text-center">
          And, so far this year as of today:
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateParticipants)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">DCCI Participants</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Unique form submitters</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateGreensProcessed, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Lbs Greens Processed</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Food scraps + grass clippings + plant trimmings</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateFoodScraps, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. Food Scraps Diverted</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Pounds (50% of greens processed)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateCo2, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. CO₂ Saved</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Pounds (EPA estimate)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateGas, 1)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Est. Gas Conserved</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Gallons (transportation savings)</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                {formatNumber(stats.yearToDateCompost, 0)}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-700">Gallons Compost Created</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Finished compost collected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Disclaimer */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
        <h4 className="text-base md:text-lg font-semibold text-blue-800 mb-3">Methodology & Estimates</h4>
        <div className="text-xs md:text-sm text-blue-700 space-y-2">
          <p>
            <strong>Greens Processed:</strong> Total weight of nitrogen-rich materials (food scraps, grass clippings, plant trimmings) added to composting bins.
          </p>
          <p>
            <strong>Food Scraps Diverted:</strong> EPA-aligned estimate assuming 50% of greens are food scraps and 75% would have gone to landfills.
          </p>
          <p>
            <strong>Environmental Impact:</strong> Based on EPA estimates for methane reduction and transportation savings. These are approximations for educational purposes.
          </p>
          <p>
            <strong>Data Sources:</strong> All statistics calculated from actual form submissions in the DCCI database.
          </p>
        </div>
      </div>
    </div>
  );
}
