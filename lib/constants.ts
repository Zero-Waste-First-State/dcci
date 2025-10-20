// DNREC 2024 Final Results Constants
// Based on 4th Quarter Report - Plastic Free Delaware Talley Day Park Community Composting Site
// Report Period: October-December 2024, Due: January 15, 2025

export const DNREC_2024_FINAL_RESULTS = {
  // Quantity of Composted Green Materials Accepted (food scraps and green plants)
  greens: {
    pounds: 1731.58,
    gallons: 394.94
  },
  
  // Estimated Quantity of Composted Brown Materials Accepted (yard waste)
  browns: {
    pounds: 1600.87,
    gallons: 1664
  },
  
  // Quantity of finished compost distributed (material taken by site member participants)
  finished_compost: {
    gallons: 55
  },
  
  // Quantity of ancillary wastes and/or litter sent for disposal, recycling, or reuse
  ancillary_wastes: 4,
  
  // Number of litter instances reported
  litter_instances: 0, // This would need to be updated with actual 2024 data
  
  // Description of instances of deviations from or noncompliance with the permit
  permit_deviations: 'n/a'
} as const;

// Helper functions for DNREC calculations
export const DNREC_CALCULATIONS = {
  // Calculate total greens weight (lbs + gallons converted to lbs)
  getTotalGreensWeight: () => {
    // Assuming 1 gallon ≈ 8.34 lbs for water-based materials
    const gallonsToPounds = DNREC_2024_FINAL_RESULTS.greens.gallons * 8.34;
    return DNREC_2024_FINAL_RESULTS.greens.pounds + gallonsToPounds;
  },
  
  // Calculate total browns weight (lbs + gallons converted to lbs)
  getTotalBrownsWeight: () => {
    // Assuming 1 gallon ≈ 8.34 lbs for water-based materials
    const gallonsToPounds = DNREC_2024_FINAL_RESULTS.browns.gallons * 8.34;
    return DNREC_2024_FINAL_RESULTS.browns.pounds + gallonsToPounds;
  },
  
  // Calculate total input weight
  getTotalInputWeight: () => {
    return DNREC_CALCULATIONS.getTotalGreensWeight() + DNREC_CALCULATIONS.getTotalBrownsWeight();
  },
  
  // Calculate composting efficiency (output/input ratio)
  getCompostingEfficiency: () => {
    const totalInput = DNREC_CALCULATIONS.getTotalInputWeight();
    const outputGallons = DNREC_2024_FINAL_RESULTS.finished_compost.gallons;
    // Note: Finished compost is only reported in gallons, not converted to weight
    // For efficiency calculation, we use volume ratio instead of weight ratio
    const inputGallons = (DNREC_2024_FINAL_RESULTS.greens.gallons + DNREC_2024_FINAL_RESULTS.browns.gallons);
    return inputGallons > 0 ? (outputGallons / inputGallons) * 100 : 0;
  }
} as const;

// Export for use in DNREC reports and statistics
export default DNREC_2024_FINAL_RESULTS;
