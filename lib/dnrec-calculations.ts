// DNREC Quarterly Report Calculations
// Replaces SQL function with TypeScript for better maintainability and debugging

import { SupabaseClient } from '@supabase/supabase-js';

export interface QuarterlyData {
  quarter: string;
  total_composted_green_lbs: number;
  total_green_gallons: number;
  estimated_browns_lbs: number;
  total_browns_gallons: number;
  total_finished_compost_gallons: number;
  ancillary_wastes_qty: number;
  litter_instances: number;
}

// DCCI calculation constants (same as frontend)
const BUCKET_WEIGHT = 1.8; // lbs - bucket weight to subtract
const BROWNS_GALLONS_TO_POUNDS = 1.2; // 1 gallon browns = 1.2 pounds

/**
 * Calculate quarterly DNREC report data for a given year and optionally filtered by site
 * This replaces the SQL function dnrec_report() with TypeScript calculations
 * 
 * @param supabase - Supabase client instance
 * @param year - Year to calculate report for
 * @param siteId - Optional site ID to filter by (null for all sites)
 * @returns Array of quarterly data including Q1-Q4 and Total row
 */
export async function calculateQuarterlyReport(
  supabase: SupabaseClient,
  year: number,
  siteId: number | null
): Promise<QuarterlyData[]> {
  // Define quarter date ranges
  const quarters = [
    { name: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59, 999) },
    { name: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59, 999) },
    { name: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59, 999) },
    { name: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59, 999) }
  ];

  // Build query for submissions in the year
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  let submissionQuery = supabase
    .from('Form Submission')
    .select('submission_id, timestamp, site_id')
    .gte('timestamp', yearStart.toISOString())
    .lt('timestamp', yearEnd.toISOString());

  if (siteId !== null) {
    submissionQuery = submissionQuery.eq('site_id', siteId);
  }

  // Fetch all submissions for the year
  const { data: submissions, error: submissionsError } = await submissionQuery;
  if (submissionsError) {
    throw new Error(`Error fetching submissions: ${submissionsError.message}`);
  }

  if (!submissions || submissions.length === 0) {
    // Return empty quarters if no data
    return quarters.map(q => ({
      quarter: q.name,
      total_composted_green_lbs: 0,
      total_green_gallons: 0,
      estimated_browns_lbs: 0,
      total_browns_gallons: 0,
      total_finished_compost_gallons: 0,
      ancillary_wastes_qty: 0,
      litter_instances: 0
    })).concat([{
      quarter: 'Total',
      total_composted_green_lbs: 0,
      total_green_gallons: 0,
      estimated_browns_lbs: 0,
      total_browns_gallons: 0,
      total_finished_compost_gallons: 0,
      ancillary_wastes_qty: 0,
      litter_instances: 0
    }]);
  }

  const submissionIds = submissions.map(s => s.submission_id);

  // Fetch all related data in parallel for better performance
  const [
    { data: addingMaterialData, error: addingError },
    { data: brownsBinData, error: brownsError },
    { data: finishedCompostData, error: compostError },
    { data: litterData, error: litterError }
  ] = await Promise.all([
    supabase.from('Adding Material').select('*').in('submission_id', submissionIds),
    supabase.from('Browns Bin').select('*').in('submission_id', submissionIds),
    supabase.from('Finished Compost').select('*').in('submission_id', submissionIds),
    supabase.from('Litter').select('*').in('submission_id', submissionIds)
  ]);

  if (addingError) throw new Error(`Error fetching adding material: ${addingError.message}`);
  if (brownsError) throw new Error(`Error fetching browns bin: ${brownsError.message}`);
  if (compostError) throw new Error(`Error fetching finished compost: ${compostError.message}`);
  if (litterError) throw new Error(`Error fetching litter: ${litterError.message}`);

  // Create a map of submission IDs to submission objects for quick lookup
  const submissionMap = new Map(submissions.map(s => [s.submission_id, s]));

  // Calculate data for each quarter
  const quarterlyResults: QuarterlyData[] = quarters.map(quarter => {
    // Filter submissions for this quarter
    const quarterSubmissions = submissions.filter(s => {
      const timestamp = new Date(s.timestamp);
      return timestamp >= quarter.start && timestamp <= quarter.end;
    });

    const quarterSubmissionIds = new Set(quarterSubmissions.map(s => s.submission_id));

    // Calculate greens from "Adding Material" table
    const quarterGreens = (addingMaterialData || []).filter(
      am => quarterSubmissionIds.has(am.submission_id)
    );

    // Greens pounds (with bucket weight adjustment)
    const totalGreenLbs = quarterGreens.reduce((sum, am) => {
      const pounds = am.greens_pounds || 0;
      if (pounds > 0) {
        // DCCI method: Subtract bucket weight (1.8 lbs per drop-off)
        const adjustedWeight = Math.max(0, pounds - BUCKET_WEIGHT);
        return sum + adjustedWeight;
      }
      return sum;
    }, 0);

    // Greens gallons (no conversion, direct sum)
    const totalGreenGallons = quarterGreens.reduce((sum, am) => {
      return sum + (am.greens_gallons || 0);
    }, 0);

    // Calculate browns from "Browns Bin" table (THE BUG FIX!)
    const quarterBrownsBin = (brownsBinData || []).filter(
      bb => quarterSubmissionIds.has(bb.submission_id)
    );

    // ✅ FIXED: Sum both bin_a and bin_b (this was the bug!)
    const brownsBinGallons = quarterBrownsBin.reduce((sum, bb) => {
      const binA = bb.bin_a_browns_gallons || 0;
      const binB = bb.bin_b_browns_gallons || 0;
      const total = binA + binB;
      return sum + total;
    }, 0);

    // Browns pounds from "Browns Bin" table (with conversion and bucket adjustment)
    const brownsBinLbs = quarterBrownsBin.reduce((sum, bb) => {
      const binA = bb.bin_a_browns_gallons || 0;
      const binB = bb.bin_b_browns_gallons || 0;
      const gallons = binA + binB;
      if (gallons > 0) {
        // DCCI method: (gallons × 1.2) - bucket weight
        const weight = Math.max(0, (gallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
        return sum + weight;
      }
      return sum;
    }, 0);

    // Calculate browns from "Adding Material" table (regular bins)
    const addingMaterialBrownsGallons = quarterGreens.reduce((sum, am) => {
      return sum + (am.browns_gallons || 0);
    }, 0);

    const addingMaterialBrownsLbs = quarterGreens.reduce((sum, am) => {
      const gallons = am.browns_gallons || 0;
      if (gallons > 0) {
        // DCCI method: (gallons × 1.2) - bucket weight
        const weight = Math.max(0, (gallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
        return sum + weight;
      }
      return sum;
    }, 0);

    // Combine browns from both tables
    const totalBrownsGallons = brownsBinGallons + addingMaterialBrownsGallons;
    const totalBrownsLbs = brownsBinLbs + addingMaterialBrownsLbs;

    // Calculate finished compost
    const quarterCompost = (finishedCompostData || []).filter(
      fc => quarterSubmissionIds.has(fc.submission_id)
    );

    const totalFinishedCompostGallons = quarterCompost.reduce((sum, fc) => {
      return sum + (fc.gallons_compost_taken || 0);
    }, 0);

    // Calculate litter instances (count of Litter records)
    const quarterLitter = (litterData || []).filter(
      l => quarterSubmissionIds.has(l.submission_id)
    );

    const litterInstances = quarterLitter.length;

    // Ancillary wastes: Count litter records where contamination was removed
    // This represents waste sent for disposal/recycling
    const ancillaryWastes = quarterLitter.filter(
      l => l.contamination_removed === true
    ).length;

    return {
      quarter: quarter.name,
      total_composted_green_lbs: totalGreenLbs,
      total_green_gallons: totalGreenGallons,
      estimated_browns_lbs: totalBrownsLbs,
      total_browns_gallons: totalBrownsGallons,
      total_finished_compost_gallons: totalFinishedCompostGallons,
      ancillary_wastes_qty: ancillaryWastes,
      litter_instances: litterInstances
    };
  });

  // Calculate "Total" row by summing all quarters
  const totalRow: QuarterlyData = {
    quarter: 'Total',
    total_composted_green_lbs: quarterlyResults.reduce((sum, q) => sum + q.total_composted_green_lbs, 0),
    total_green_gallons: quarterlyResults.reduce((sum, q) => sum + q.total_green_gallons, 0),
    estimated_browns_lbs: quarterlyResults.reduce((sum, q) => sum + q.estimated_browns_lbs, 0),
    total_browns_gallons: quarterlyResults.reduce((sum, q) => sum + q.total_browns_gallons, 0),
    total_finished_compost_gallons: quarterlyResults.reduce((sum, q) => sum + q.total_finished_compost_gallons, 0),
    ancillary_wastes_qty: quarterlyResults.reduce((sum, q) => sum + q.ancillary_wastes_qty, 0),
    litter_instances: quarterlyResults.reduce((sum, q) => sum + q.litter_instances, 0)
  };

  return [...quarterlyResults, totalRow];
}