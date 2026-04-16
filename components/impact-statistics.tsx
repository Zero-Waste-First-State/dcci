"use client";

/**
 * Impact Statistics – public impact stats for the DCCI home page.
 * Fetches submission data from Supabase and computes totals, YTD, and EPA-aligned estimates.
 * @see DCCI_CALCULATIONS_README.md for methodology
 */

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DNREC_2024_FINAL_RESULTS } from "@/lib/constants";

interface ImpactStats {
  totalSites: number;
  totalParticipants: number;
  totalGreensProcessed: number; // pounds (used internally; not shown in "Since the Start" block)
  totalFoodScrapsDiverted: number; // pounds (estimated)
  totalMethaneReduced: number; // tons CH4 (EPA methodology)
  totalCompostCreated: number; // gallons
  co2Saved: number; // pounds (EPA estimate)
  gasConserved: number; // gallons (transportation savings)
  yearToDateParticipants: number;
  yearToDateGreensProcessed: number; // pounds
  yearToDateFoodScraps: number; // pounds (estimated)
  yearToDateCompost: number; // gallons
  yearToDateCo2: number; // pounds
  yearToDateGas: number; // gallons
}

// --- Conversion & weight constants (DCCI) ---
const BUCKET_WEIGHT = 1.8; // lbs per bucket (DCCI instructions)
const POUNDS_TO_TONS = 2000;

// --- EPA-aligned environmental impact constants ---
const FOOD_SCRAPS_PERCENTAGE = 0.98; // DCCI: 98% of greens are food scraps
const LANDFILL_DIVERSION_PERCENTAGE = 1.0; // 100% diverted from landfill
const CO2_PER_POUND_FOOD_SCRAPS = 0.5; // EPA: lbs CO2 saved per lb food waste diverted
const GAS_PER_POUND_FOOD_SCRAPS = 0.1; // Transportation savings (gallons per lb)
// EPA: avoided methane per ton of food waste diverted from landfill (tons CH4 per ton food waste)
// Source: https://www.epa.gov/land-research/quantifying-methane-emissions-landfilled-food-waste
const TONS_METHANE_PER_TON_FOOD_SCRAPS = 0.042;

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
      const baselineEnd = new Date("2024-12-31T23:59:59Z");
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

      // Fetch adding material data (food scraps) - only need pounds for greens calculation
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

      const postBaselineSubmissions =
        submissionsData?.filter(s => new Date(s.timestamp) > baselineEnd) || [];
      const postBaselineSubmissionIds = postBaselineSubmissions.map(
        s => s.submission_id
      );

      // Year-to-date greens processed using DCCI bucket adjustment
      // Only sum greens_pounds (gallons are a different measurement and should not be converted/added)
      const yearToDateSubmissionIds = yearToDateSubmissions.map(s => s.submission_id);
      const yearToDateGreensProcessed = addingData?.filter(
        record => yearToDateSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => {
        // Only include greens_pounds (with bucket adjustment)
        if (record.greens_pounds && record.greens_pounds > 0) {
          // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
          return sum + Math.max(0, record.greens_pounds - BUCKET_WEIGHT);
        }
        return sum;
      }, 0) || 0;

      // Post-baseline greens processed using DCCI bucket adjustment
      // Only sum greens_pounds (gallons are a different measurement and should not be converted/added)
      const postBaselineGreens = addingData?.filter(
        record => postBaselineSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => {
        // Only include greens_pounds (with bucket adjustment)
        if (record.greens_pounds && record.greens_pounds > 0) {
          // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
          return sum + Math.max(0, record.greens_pounds - BUCKET_WEIGHT);
        }
        return sum;
      }, 0) || 0;

      // Year-to-date estimated food scraps diverted
      const yearToDateFoodScraps = yearToDateGreensProcessed * FOOD_SCRAPS_PERCENTAGE * LANDFILL_DIVERSION_PERCENTAGE;

      const postBaselineFoodScraps = postBaselineGreens * FOOD_SCRAPS_PERCENTAGE * LANDFILL_DIVERSION_PERCENTAGE;

      // Year-to-date compost
      const yearToDateCompost = compostData?.filter(
        record => yearToDateSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => sum + (record.gallons_compost_taken || 0), 0) || 0;

      const postBaselineCompost = compostData?.filter(
        record => postBaselineSubmissionIds.includes(record.submission_id)
      ).reduce((sum, record) => sum + (record.gallons_compost_taken || 0), 0) || 0;

      // Baseline greens from 2024 - only use pounds (gallons are a different measurement)
      const baselineGreens = DNREC_2024_FINAL_RESULTS.greens.pounds;
      const baselineFoodScraps = baselineGreens * FOOD_SCRAPS_PERCENTAGE * LANDFILL_DIVERSION_PERCENTAGE;
      const baselineCompost = DNREC_2024_FINAL_RESULTS.finished_compost.gallons;

      const totalGreensProcessed = baselineGreens + postBaselineGreens;
      const totalFoodScrapsDiverted = baselineFoodScraps + postBaselineFoodScraps;
      const totalCompostCreated = baselineCompost + postBaselineCompost;

      const totalCo2Saved = totalFoodScrapsDiverted * CO2_PER_POUND_FOOD_SCRAPS;
      const totalGasConserved = totalFoodScrapsDiverted * GAS_PER_POUND_FOOD_SCRAPS;
      // Methane reduced (tons CH4) per EPA methodology: tons food scraps × factor
      const totalFoodScrapsTons = totalFoodScrapsDiverted / POUNDS_TO_TONS;
      const totalMethaneReduced = totalFoodScrapsTons * TONS_METHANE_PER_TON_FOOD_SCRAPS;

      const yearToDateCo2 = yearToDateFoodScraps * CO2_PER_POUND_FOOD_SCRAPS;
      const yearToDateGas = yearToDateFoodScraps * GAS_PER_POUND_FOOD_SCRAPS;

      setStats({
        totalSites,
        totalParticipants: uniqueParticipants,
        totalGreensProcessed,
        totalFoodScrapsDiverted,
        totalMethaneReduced,
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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 md:p-8 shadow-lg w-full max-w-4xl mx-auto">
      {/* Section: Total since launch (Jan 1, 2024) – no redundant title block */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold text-green-700 mb-3 md:mb-4 text-center">
          Since Launch (January 1, 2024)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {stats.totalSites} {stats.totalSites > 1 ? 'Sites' : 'Site'}
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Launch</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.totalParticipants)} Members
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Participating</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatTons(stats.totalFoodScrapsDiverted)} Tons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Food Scraps Diverted <sup><small><a href="#footnote1-scraps">[1]</a></small></sup></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.totalMethaneReduced, 2)} Tons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Methane Production Reduced <sup><small><a href="#footnote2-methane">[2]</a></small></sup></div>
              {/*<div className="text-xs md:text-sm text-gray-500 mt-0.5">EPA methodology (avoided landfilled food waste)</div>*/}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.co2Saved, 0)} Lbs. CO<sub>2</sub>
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Saved <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>
              {/*<div className="text-xs md:text-sm text-gray-500 mt-0.5">EPA Estimate *</div>*/}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.gasConserved, 1)} Gallons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Fuel Conserved <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>
              {/*<div className="text-xs md:text-sm text-gray-500 mt-0.5">Transportation savings <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>*/}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.totalCompostCreated, 0)} Gallons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Compost Created</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: So far this year */}
      <div>
        <h3 className="text-lg md:text-xl font-bold text-green-700 mb-3 md:mb-4 text-center">
          So far this year (as of today)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.yearToDateParticipants)} Members
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Participating</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.yearToDateFoodScraps, 0)} Lbs.
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Food Scraps Diverted <sup><small><a href="#footnote1-scraps">[1]</a></small></sup></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.yearToDateCo2, 0)} Lbs. CO<sub>2</sub>
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Saved <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>
              {/*<div className="text-xs md:text-sm text-gray-500 mt-0.5">EPA Estimate *</div>*/}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.yearToDateGas, 1)} Gallons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Fuel Conserved <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>
              {/*<div className="text-xs md:text-sm text-gray-500 mt-0.5">Transportation savings <sup><small><a href="#footnote3-co2gas">[3]</a></small></sup></div>*/}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-5 shadow-md border border-green-100">
            <div className="text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {formatNumber(stats.yearToDateCompost, 0)} Gallons
              </div>
              <div className="text-base md:text-lg font-medium text-gray-700">Compost Created</div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology disclaimer – slightly larger font for readability */}
      <div className="mt-6 md:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
        <h4 className="text-sm md:text-base font-semibold text-blue-800 mb-2">Methodology & Estimates</h4>
        <div className="text-sm md:text-base text-blue-700 space-y-2">
          <ol className="list-decimal ml-4">
            <li id="footnote1-scraps">
              <strong>Food Scraps Diverted:</strong> EPA-aligned estimate (98% of greens as food scraps, 100% diverted from landfill).
            </li>
            <li id="footnote2-methane">
              <strong>Methane Reduced:</strong> Based on EPA methodology for avoided landfilled food waste. See{" "}
              <a href="https://www.epa.gov/land-research/quantifying-methane-emissions-landfilled-food-waste" target="_blank" rel="noreferrer noopener" className="underline">EPA Quantifying Methane Emissions from Landfilled Food Waste</a>.
            </li>
            <li id="footnote3-co2gas">
              <strong>CO<sub>2</sub> & Gas:</strong> EPA estimate for CO<sub>2</sub>; transportation savings for fuel conserved. Approximations for educational purposes.
            </li>
          </ol>
          <p>
            <strong>Data:</strong> All statistics from actual form submissions in the DCCI database.
          </p>
        </div>
      </div>
    </div>
  );
}
