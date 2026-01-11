# TypeScript vs SQL Function Approach

## Answer: YES, You Can Use TypeScript Instead!

You're **not limited to SQL functions**. You can absolutely move all calculations to TypeScript/Next.js backend code. In fact, this is often **better** for maintenance and debugging.

---

## Current Approach (SQL Function)

**What happens now:**
1. API route (`app/api/dnrec/pdf/route.tsx`) calls `supabase.rpc('dnrec_report', args)`
2. SQL function in Supabase database does all the calculations
3. Results come back to TypeScript code
4. TypeScript just formats and renders the PDF

**Problems with SQL approach:**
- ❌ Hard to debug (need to access Supabase SQL Editor)
- ❌ Hard to version control (SQL functions aren't in your codebase)
- ❌ Hard to test locally
- ❌ Hard to maintain (SQL logic separate from TypeScript code)
- ❌ Can't use TypeScript type checking
- ❌ Harder to collaborate on (requires database access)

---

## Recommended Approach (TypeScript)

**What would happen:**
1. API route fetches raw data from Supabase tables
2. TypeScript code does all calculations (same logic as frontend)
3. TypeScript code formats results
4. TypeScript renders the PDF

**Benefits of TypeScript approach:**
- ✅ Easy to debug (use VS Code debugger, console.log, etc.)
- ✅ Version controlled (all code in Git)
- ✅ Easy to test locally
- ✅ Easy to maintain (all logic in one place)
- ✅ TypeScript type safety
- ✅ Easy to collaborate (just code review)
- ✅ Consistent with frontend code patterns
- ✅ Can reuse calculation logic

**Drawbacks:**
- ⚠️ Slightly more database queries (but negligible for your data size)
- ⚠️ Slightly more code (but much easier to work with)

---

## Implementation: TypeScript Version

Here's how you could replace the SQL function with TypeScript code:

### Current Code (SQL Function Approach):

```typescript
// app/api/dnrec/pdf/route.tsx (current)
} else {
  // Use normal database query for other years
  const result = await supabase.rpc('dnrec_report', args);
  data = result.data;
  error = result.error;
}
```

### Replacement Code (TypeScript Approach):

```typescript
// app/api/dnrec/pdf/route.tsx (proposed)
} else {
  // Calculate quarterly data in TypeScript instead of SQL
  const year = parseInt(yearParam, 10);
  const siteId = (siteParam && siteParam !== 'total') ? parseInt(siteParam, 10) : null;
  
  data = await calculateQuarterlyReport(supabase, year, siteId);
  error = null;
}
```

### New Helper Function (TypeScript Calculation):

Create a new file: `lib/dnrec-calculations.ts`

```typescript
// lib/dnrec-calculations.ts
import { SupabaseClient } from '@supabase/supabase-js';

interface QuarterlyData {
  quarter: string;
  total_composted_green_lbs: number;
  total_green_gallons: number;
  estimated_browns_lbs: number;
  total_browns_gallons: number;
  total_finished_compost_gallons: number;
  ancillary_wastes_qty: number;
  litter_instances: number;
}

const BUCKET_WEIGHT = 1.8; // lbs
const BROWNS_GALLONS_TO_POUNDS = 1.2; // 1 gallon = 1.2 lbs

export async function calculateQuarterlyReport(
  supabase: SupabaseClient,
  year: number,
  siteId: number | null
): Promise<QuarterlyData[]> {
  // Define quarter date ranges
  const quarters = [
    { name: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59) },
    { name: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59) },
    { name: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59) },
    { name: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59) }
  ];

  // Build query filters
  let submissionQuery = supabase
    .from('Form Submission')
    .select('submission_id, timestamp, site_id')
    .gte('timestamp', new Date(year, 0, 1).toISOString())
    .lt('timestamp', new Date(year + 1, 0, 1).toISOString());

  if (siteId !== null) {
    submissionQuery = submissionQuery.eq('site_id', siteId);
  }

  // Fetch all submissions for the year
  const { data: submissions, error: submissionsError } = await submissionQuery;
  if (submissionsError) throw submissionsError;

  // Fetch all related data in parallel
  const submissionIds = submissions?.map(s => s.submission_id) || [];

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

  if (addingError) throw addingError;
  if (brownsError) throw brownsError;
  if (compostError) throw compostError;
  if (litterError) throw litterError;

  // Calculate data for each quarter
  const quarterlyResults: QuarterlyData[] = quarters.map(quarter => {
    // Filter submissions for this quarter
    const quarterSubmissions = submissions?.filter(s => {
      const timestamp = new Date(s.timestamp);
      return timestamp >= quarter.start && timestamp <= quarter.end;
    }) || [];

    const quarterSubmissionIds = quarterSubmissions.map(s => s.submission_id);

    // Calculate greens (from "Adding Material" table)
    const quarterGreens = addingMaterialData?.filter(
      am => quarterSubmissionIds.includes(am.submission_id)
    ) || [];

    const totalGreenLbs = quarterGreens.reduce((sum, am) => {
      const adjustedWeight = Math.max(0, (am.greens_pounds || 0) - BUCKET_WEIGHT);
      return sum + adjustedWeight;
    }, 0);

    const totalGreenGallons = quarterGreens.reduce((sum, am) => {
      return sum + (am.greens_gallons || 0);
    }, 0);

    // Calculate browns from "Browns Bin" table (THE BUG FIX!)
    const quarterBrownsBin = brownsBinData?.filter(
      bb => quarterSubmissionIds.includes(bb.submission_id)
    ) || [];

    const brownsBinGallons = quarterBrownsBin.reduce((sum, bb) => {
      // ✅ CORRECT: Sum both bin_a and bin_b
      const total = (bb.bin_a_browns_gallons || 0) + (bb.bin_b_browns_gallons || 0);
      return sum + total;
    }, 0);

    const brownsBinLbs = quarterBrownsBin.reduce((sum, bb) => {
      // Calculate weight: (gallons × 1.2) - bucket weight
      const gallons = (bb.bin_a_browns_gallons || 0) + (bb.bin_b_browns_gallons || 0);
      if (gallons > 0) {
        const weight = Math.max(0, (gallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
        return sum + weight;
      }
      return sum;
    }, 0);

    // Calculate browns from "Adding Material" table
    const addingMaterialBrownsGallons = quarterGreens.reduce((sum, am) => {
      return sum + (am.browns_gallons || 0);
    }, 0);

    const addingMaterialBrownsLbs = quarterGreens.reduce((sum, am) => {
      const gallons = am.browns_gallons || 0;
      if (gallons > 0) {
        const weight = Math.max(0, (gallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
        return sum + weight;
      }
      return sum;
    }, 0);

    // Combine browns from both tables
    const totalBrownsGallons = brownsBinGallons + addingMaterialBrownsGallons;
    const totalBrownsLbs = brownsBinLbs + addingMaterialBrownsLbs;

    // Calculate finished compost
    const quarterCompost = finishedCompostData?.filter(
      fc => quarterSubmissionIds.includes(fc.submission_id)
    ) || [];

    const totalFinishedCompostGallons = quarterCompost.reduce((sum, fc) => {
      return sum + (fc.gallons_compost_taken || 0);
    }, 0);

    // Calculate litter instances
    const quarterLitter = litterData?.filter(
      l => quarterSubmissionIds.includes(l.submission_id)
    ) || [];

    const litterInstances = quarterLitter.length;

    // Ancillary wastes (if you track this - may need adjustment)
    const ancillaryWastes = 0; // Adjust based on your data structure

    return {
      quarter: quarter.name,
      total_composted_green_lbs: totalGreenLbs,
      total_green_gallons: totalGreenGallons,
      estimated_browns_lbs: totalBrownsLbs,
      total_browns_gallons: totalBrownsGallons, // ✅ FIXED: Now includes both bins!
      total_finished_compost_gallons: totalFinishedCompostGallons,
      ancillary_wastes_qty: ancillaryWastes,
      litter_instances: litterInstances
    };
  });

  // Also calculate "Total" row
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
```

### Updated API Route:

```typescript
// app/api/dnrec/pdf/route.tsx (updated)
import { calculateQuarterlyReport } from '@/lib/dnrec-calculations';

export async function GET(req: Request) {
  // ... existing code ...

  let data;
  let error;

  // Use 2024 constants if year is 2024
  if (yearParam === '2024') {
    // ... existing 2024 logic ...
  } else {
    // ✅ NEW: Calculate in TypeScript instead of SQL
    try {
      const year = parseInt(yearParam, 10);
      const siteId = (siteParam && siteParam !== 'total') ? parseInt(siteParam, 10) : null;
      
      data = await calculateQuarterlyReport(supabase, year, siteId);
      error = null;
    } catch (err) {
      error = err as Error;
      data = null;
    }
  }

  // ... rest of existing code ...
}
```

---

## Comparison Table

| Aspect | SQL Function | TypeScript |
|--------|--------------|------------|
| **Debugging** | ❌ Need Supabase access | ✅ VS Code debugger, console.log |
| **Version Control** | ❌ Not in Git | ✅ Full Git history |
| **Testing** | ❌ Need database | ✅ Unit tests, local testing |
| **Maintenance** | ❌ SQL + TypeScript | ✅ Just TypeScript |
| **Type Safety** | ❌ No types | ✅ Full TypeScript types |
| **Collaboration** | ❌ Database access needed | ✅ Code review |
| **Performance** | ✅ Slightly faster | ⚠️ Negligible difference |
| **Code Reuse** | ❌ Can't reuse | ✅ Share logic with frontend |

---

## Recommendation

**✅ Use TypeScript approach** - It's better in almost every way for your use case.

**Why:**
1. Your data size is small (not millions of records) - performance difference is negligible
2. Maintenance is much easier (all code in one place)
3. Debugging is much easier (standard tools)
4. You can fix the browns calculation bug immediately
5. Consistent with how your frontend code already works

---

## Migration Steps

1. **Create the TypeScript calculation function** (`lib/dnrec-calculations.ts`)
2. **Update the API route** to use TypeScript function instead of SQL function
3. **Test with 2025 Q4 data** - should now show 514 gallons instead of 270
4. **Keep SQL function for now** (as backup) or remove it
5. **Deploy and verify**

---

## Key Fix in TypeScript Version

The bug fix is here - notice we correctly sum **both bins**:

```typescript
// ✅ CORRECT: Sum both bin_a and bin_b
const brownsBinGallons = quarterBrownsBin.reduce((sum, bb) => {
  const total = (bb.bin_a_browns_gallons || 0) + (bb.bin_b_browns_gallons || 0);
  return sum + total;
}, 0);
```

This is the same pattern your frontend code uses, which is why frontend displays are correct but reports are wrong!

---

## Next Steps

Would you like me to:
1. Create the complete TypeScript calculation function?
2. Update the API route to use it?
3. Show you how to test it locally?

This will fix the browns calculation bug and make future maintenance much easier!