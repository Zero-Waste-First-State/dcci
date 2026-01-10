# Calculation Issues Diagnosis Guide

## Summary of Issues from Email Chain

### Issue 1: Quarter Reports - Browns Gallons Calculation
**Problem:**
- 2025 Q4: Manual calculation = **514 gallons**, Report shows = **270 gallons** (~47% of actual)
- 2026 (single day): Manual calculation = **60.2 gallons**, Report shows = **64 gallons** (close but off)
- Q1-Q3 2025 are **correct**
- Q4 2025 is when they stopped using Google Sheets and only used the H4I website

**Key Details:**
- Date ranges: Q1 (Jan 1-Mar 31), Q2 (Apr 1-Jun 30), Q3 (Jul 1-Sep 30), Q4 (Oct 1-Dec 31)
- Manual calculation: Simply adding up each instance of browns gallons from the staff dashboard
- Browns are stored in the **"Browns Bin"** table with fields:
  - `bin_a_browns_gallons` (gallons for Bin A)
  - `bin_b_browns_gallons` (gallons for Bin B)
  - Total browns gallons per entry = `bin_a_browns_gallons + bin_b_browns_gallons`

### Issue 2: Home Page - Total Greens Since Launch
**Problem:**
- Total greens processed since launch should be **4-5 tons** but showing less
- This might be related to the Google Sheets import or calculation logic

---

## Where to Investigate

### 1. SQL Function: `dnrec_report()` (PRIMARY SUSPECT)

**Location:** Supabase Database (not in codebase)
**Access:** Supabase Dashboard → SQL Editor

**What to Check:**
1. Does the function exist?
   ```sql
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name = 'dnrec_report';
   ```

2. How does it calculate browns gallons?
   - Should be: `SUM(bin_a_browns_gallons + bin_b_browns_gallons)`
   - Should filter by quarter date ranges
   - Should join "Browns Bin" table with "Form Submission" table to get dates

3. Is it properly joining the tables?
   ```sql
   -- Expected structure:
   SELECT 
     -- quarter calculation
     SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) as total_browns_gallons
   FROM "Browns Bin" bb
   JOIN "Form Submission" fs ON bb.submission_id = fs.submission_id
   WHERE 
     -- date filtering for quarters
   GROUP BY quarter
   ```

**Potential Issues:**
- Function might not be summing both `bin_a_browns_gallons` and `bin_b_browns_gallons`
- Function might be missing entries from "Browns Bin" table
- Date filtering might be incorrect for Q4 2025
- Function might be looking at wrong table (e.g., "Adding Material" instead of "Browns Bin")

**Files Referenced:**
- `app/api/dnrec/pdf/route.tsx` (line 47) - Calls `supabase.rpc('dnrec_report', args)`
- `DCCI_CALCULATIONS_README.md` (line 316) - Mentions SQL function `public.dnrec_report()`

---

### 2. Home Page Calculation: `components/impact-statistics.tsx`

**Location:** `components/impact-statistics.tsx`
**Function:** `fetchImpactStats()` (lines 46-180)

**What to Check:**
1. How total greens are calculated (lines 102-127)
2. How post-baseline greens are calculated (lines 120-127)
3. Whether it's properly fetching all "Adding Material" records
4. Whether date filtering is correct (baselineEnd = 2024-12-31, line 55)

**Key Code Sections:**
- Line 73-77: Fetches "Adding Material" data
- Line 120-127: Calculates post-baseline greens (after 2024)
- Line 143: Uses `DNREC_2024_FINAL_RESULTS.greens.pounds` for baseline
- Line 147: Total = baseline + post-baseline

**Potential Issues:**
- Might not be fetching all records from "Adding Material" table
- Date filtering might be excluding some records
- Baseline constants might be incorrect
- Might not be properly handling the bucket weight subtraction (1.8 lbs)

---

## Expected Behavior for Browns Gallons

### According to Documentation (`DCCI_CALCULATIONS_README.md`):
- **For Weight Calculation:** `(Gallons × 1.2) - Bucket Weight`
- **For Quarter Reports (Gallons Only):** Simple sum - no conversion needed
- Brown gallons are stored in **"Browns Bin"** table
- Each entry has: `bin_a_browns_gallons` and `bin_b_browns_gallons`
- Total per entry: `bin_a_browns_gallons + bin_b_browns_gallons`

### How Code Currently Handles Browns:
- `components/weight-distribution-graph.tsx` (line 148):
  ```typescript
  const brownsGallons = (record.bin_a_browns_gallons || 0) + (record.bin_b_browns_gallons || 0);
  ```
- `components/daily-calendar.tsx` (line 133):
  ```typescript
  const brownsGallons = (browns.bin_a_browns_gallons || 0) + (browns.bin_b_browns_gallons || 0);
  ```

**This pattern is correct!** The SQL function should do the same.

---

## Testing Strategy

### For Quarter Reports:
1. **Test SQL Query Directly:**
   ```sql
   -- Test Q4 2025 browns gallons
   SELECT 
     SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) as total_browns_gallons
   FROM "Browns Bin" bb
   JOIN "Form Submission" fs ON bb.submission_id = fs.submission_id
   WHERE fs.timestamp >= '2025-10-01' 
     AND fs.timestamp < '2026-01-01'
   ```
   Compare this result to Elisa's manual calculation of 514 gallons.

2. **Check if function exists and view its definition:**
   ```sql
   SELECT pg_get_functiondef(oid) 
   FROM pg_proc 
   WHERE proname = 'dnrec_report';
   ```

3. **Test 2026 data:**
   ```sql
   -- Test 2026 browns gallons (Jan 10, 2026)
   SELECT 
     SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) as total_browns_gallons
   FROM "Browns Bin" bb
   JOIN "Form Submission" fs ON bb.submission_id = fs.submission_id
   WHERE fs.timestamp >= '2026-01-10' 
     AND fs.timestamp < '2026-01-11'
   ```
   Should be close to 60.2 gallons (Elisa's manual calculation).

### For Home Page:
1. **Test total greens calculation:**
   ```sql
   -- Check total greens from "Adding Material" table
   SELECT 
     COUNT(*) as total_records,
     SUM(greens_pounds) as total_greens_pounds,
     SUM(greens_gallons) as total_greens_gallons
   FROM "Adding Material"
   ```
   
2. **Check post-baseline greens (after 2024-12-31):**
   ```sql
   SELECT 
     COUNT(*) as total_records,
     SUM(am.greens_pounds) as total_greens_pounds
   FROM "Adding Material" am
   JOIN "Form Submission" fs ON am.submission_id = fs.submission_id
   WHERE fs.timestamp > '2024-12-31 23:59:59'
   ```

---

## Key Files Reference

| File | Purpose | Lines to Check |
|------|---------|----------------|
| `app/api/dnrec/pdf/route.tsx` | Calls SQL function for reports | Line 47 |
| `components/impact-statistics.tsx` | Home page calculations | Lines 46-180 |
| `DCCI_CALCULATIONS_README.md` | Documentation on calculations | Lines 48-73, 316 |
| `lib/constants.ts` | DNREC 2024 constants | Lines 5-31 |
| `SUPABASE_README.md` | Database schema documentation | Lines 50 |

---

## Next Steps

1. **PRIORITY 1:** Check the SQL function `dnrec_report()` in Supabase
   - Verify it sums `bin_a_browns_gallons + bin_b_browns_gallons`
   - Verify it's using the "Browns Bin" table (not "Adding Material")
   - Verify date filtering is correct for quarters

2. **PRIORITY 2:** Check home page calculation
   - Verify it's fetching all "Adding Material" records
   - Verify date filtering is correct
   - Verify bucket weight subtraction is applied

3. **Test with actual data:**
   - Run SQL queries directly to compare with Elisa's manual calculations
   - Verify the discrepancy matches the reported issue

---

## Important Notes

- **Browns gallons for reports should be a SIMPLE SUM** - no conversion or bucket weight subtraction
- **Only for weight calculations** do we use `(gallons × 1.2) - bucket weight`
- The "Browns Bin" table is separate from "Adding Material" table
- Q4 2025 issue happened when they switched from Google Sheets to H4I website
- First 3 quarters of 2025 are correct (those were imported from Google Sheets)