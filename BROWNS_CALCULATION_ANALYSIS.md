# Browns Calculation Analysis - Issue 1 Diagnosis

## Executive Summary

**Problem:** Quarter reports show 270 gallons of browns for Q4 2025, but manual calculation shows 514 gallons (47% discrepancy).

**Root Cause:** The SQL function `dnrec_report()` in Supabase is likely the issue - it's either:
1. Not properly summing both `bin_a_browns_gallons` and `bin_b_browns_gallons` from "Browns Bin" table
2. Only looking at one table (missing "Browns Bin" or "Adding Material")
3. Not handling NULL values correctly

**Evidence:** Q1-Q3 2025 are correct (imported data), Q4 2025 is wrong (website-entered data), suggesting the SQL function has a bug.

---

## How Browns Data Is Structured

### There Are TWO Separate Tables With Browns Data:

#### 1. "Browns Bin" Table
**Purpose:** When users add material specifically to browns bins (dedicated browns bins)

**Fields:**
- `browns_id` (primary key)
- `submission_id` (foreign key to "Form Submission")
- `bin_a_browns_gallons` (gallons for Bin A)
- `bin_b_browns_gallons` (gallons for Bin B)
- `bin_a_red_line` (boolean)
- `bin_b_red_line` (boolean)

**How to Calculate Total:**
```typescript
total_browns_gallons = (bin_a_browns_gallons || 0) + (bin_b_browns_gallons || 0)
```

**Example from Import CSV:**
```
browns_id=5: bin_a=10, bin_b=10 → total = 20 gallons
browns_id=12: bin_a=50, bin_b=50 → total = 100 gallons
browns_id=2: bin_a=120, bin_b=NULL → total = 120 gallons
```

#### 2. "Adding Material" Table
**Purpose:** When users add material to regular composting bins (bin1, bin2, bin3) which includes browns

**Fields:**
- `bin_id` (primary key)
- `submission_id` (foreign key to "Form Submission")
- `bin_type` (1, 2, or 3 for bin1, bin2, bin3)
- `greens_pounds` (pounds of greens)
- `greens_gallons` (gallons of greens)
- `browns_gallons` (gallons of browns) ← **This field also exists!**
- `red_line` (boolean)

**How to Calculate Total:**
```typescript
total_browns_gallons = browns_gallons || 0  // Single value, not split by bin
```

### Important Distinction:

- **"Browns Bin" table:** Used when task type is "browns" - users add to dedicated browns bins (A and B)
- **"Adding Material" table:** Used when task type is "add_material" with regular bins - users can add browns along with greens

**Both tables can have browns data, and BOTH should be included in quarter reports!**

---

## How Frontend Code Currently Handles Browns

### ✅ Correct Implementation Patterns:

#### 1. Weight Distribution Graph (`components/weight-distribution-graph.tsx`)
```typescript
// Lines 146-155
const brownsRecords = brownsData?.filter(record => record.submission_id === submission.submission_id) || [];
brownsRecords.forEach(record => {
  const brownsGallons = (record.bin_a_browns_gallons || 0) + (record.bin_b_browns_gallons || 0);
  if (brownsGallons > 0) {
    // DCCI method: (gallons × 1.2) - bucket weight
    const brownsWeight = Math.max(0, (brownsGallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
    acc[date].added += brownsWeight;
  }
});
```
**✅ Correctly sums:** `bin_a_browns_gallons + bin_b_browns_gallons`

#### 2. Daily Calendar (`components/daily-calendar.tsx`)
```typescript
// Lines 131-139
if (submission["Browns Bin"] && submission["Browns Bin"].length > 0) {
  submission["Browns Bin"].forEach((browns: any) => {
    const brownsGallons = (browns.bin_a_browns_gallons || 0) + (browns.bin_b_browns_gallons || 0);
    if (brownsGallons > 0) {
      // DCCI method: (gallons × 1.2) - bucket weight
      const brownsWeight = Math.max(0, (brownsGallons * BROWNS_GALLONS_TO_POUNDS) - BUCKET_WEIGHT);
      dayData.added += brownsWeight;
    }
  });
}
```
**✅ Correctly sums:** `bin_a_browns_gallons + bin_b_browns_gallons`

### ⚠️ What's Missing:

**The frontend code only processes "Browns Bin" table for weight calculations!**

It doesn't process browns from "Adding Material" table for weight calculations. However, for **quarter reports (gallons only)**, we should be summing browns from BOTH tables.

---

## How Backend Code Currently Works

### API Route (`app/api/dnrec/pdf/route.tsx`)

```typescript
// Lines 45-50
} else {
  // Use normal database query for other years
  const result = await supabase.rpc('dnrec_report', args);
  data = result.data;
  error = result.error;
}
```

**The backend simply calls the SQL function `dnrec_report()`** - it doesn't do any calculation itself!

**This means the bug is in the SQL function, not the backend TypeScript code.**

---

## Expected SQL Function Behavior

### What `dnrec_report()` SHOULD Do:

```sql
-- For each quarter in the specified year:
-- 1. Sum browns from "Browns Bin" table
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM fs.timestamp) IN (1,2,3) THEN 'Q1'
    WHEN EXTRACT(MONTH FROM fs.timestamp) IN (4,5,6) THEN 'Q2'
    WHEN EXTRACT(MONTH FROM fs.timestamp) IN (7,8,9) THEN 'Q3'
    WHEN EXTRACT(MONTH FROM fs.timestamp) IN (10,11,12) THEN 'Q4'
  END as quarter,
  
  -- Browns from "Browns Bin" table
  SUM(COALESCE(bb.bin_a_browns_gallons, 0) + COALESCE(bb.bin_b_browns_gallons, 0)) as browns_bin_total,
  
  -- Browns from "Adding Material" table
  SUM(COALESCE(am.browns_gallons, 0)) as adding_material_browns,
  
  -- Total browns (BOTH tables combined)
  SUM(COALESCE(bb.bin_a_browns_gallons, 0) + COALESCE(bb.bin_b_browns_gallons, 0)) + 
  SUM(COALESCE(am.browns_gallons, 0)) as total_browns_gallons

FROM "Form Submission" fs

-- Left join "Browns Bin" table (may not exist for all submissions)
LEFT JOIN "Browns Bin" bb ON bb.submission_id = fs.submission_id

-- Left join "Adding Material" table (may not exist for all submissions)
LEFT JOIN "Adding Material" am ON am.submission_id = fs.submission_id

WHERE EXTRACT(YEAR FROM fs.timestamp) = year_input
  AND (site_id_input IS NULL OR fs.site_id = site_id_input)

GROUP BY quarter;
```

### Potential Issues in SQL Function:

1. **Only summing one bin:**
   ```sql
   -- WRONG: Only bin_a
   SUM(bb.bin_a_browns_gallons) as total_browns_gallons
   
   -- WRONG: Only bin_b
   SUM(bb.bin_b_browns_gallons) as total_browns_gallons
   
   -- CORRECT: Both bins
   SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) as total_browns_gallons
   ```

2. **Not handling NULLs:**
   ```sql
   -- WRONG: NULL + number = NULL in SQL!
   SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons)
   
   -- CORRECT: Use COALESCE
   SUM(COALESCE(bb.bin_a_browns_gallons, 0) + COALESCE(bb.bin_b_browns_gallons, 0))
   ```

3. **Only looking at one table:**
   - If function only looks at "Adding Material" table → missing "Browns Bin" data
   - If function only looks at "Browns Bin" table → missing "Adding Material" browns
   - **Both should be included!**

4. **Using INNER JOIN instead of LEFT JOIN:**
   - If using INNER JOIN, submissions without browns data won't be counted
   - Should use LEFT JOIN to include all submissions

---

## Evidence Analysis

### What We Know:

1. **Q1-Q3 2025:** ✅ Correct (these were imported from Google Sheets)
2. **Q4 2025:** ❌ Wrong (270 gallons vs 514 gallons expected - 47% discrepancy)
3. **Q4 was when they switched to website-only** (stopped using Google Sheets)
4. **2026 single day:** Slightly off (64 gallons vs 60.2 gallons - close but not exact)

### Key Insight:

**The fact that Q1-Q3 are correct but Q4 is wrong suggests:**
- It's NOT an import issue (import worked fine for Q1-Q3)
- It's likely a **SQL function bug** that affects data entered through the website
- The SQL function might be working differently for imported data vs website-entered data, OR
- The SQL function has always been wrong, but the imported data structure somehow worked around it

### The 47% Discrepancy (270 vs 514):

**If the function is only summing one bin instead of both:**
- Total: 514 gallons
- If only bin_a: ~270 gallons (52% of total)
- If only bin_b: ~244 gallons (48% of total)

**This suggests the function might only be summing `bin_a_browns_gallons` and missing `bin_b_browns_gallons`!**

---

## Import Data Analysis

### From `2025_import_data/browns_bin.csv`:

Looking at the import CSV, I can see entries like:
- Row 5: `bin_a=10, bin_b=10` → total should be 20
- Row 12: `bin_a=50, bin_b=50` → total should be 100
- Row 2: `bin_a=120, bin_b=NULL` → total should be 120

**The import data structure is correct** - it has both bin_a and bin_b fields.

**This confirms:** The import process is fine, the issue is in the SQL function calculation.

---

## Testing Strategy

### Step 1: Check SQL Function Definition

Run in Supabase SQL Editor:
```sql
-- View the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'dnrec_report';
```

**Look for:**
- Is it summing `bin_a_browns_gallons + bin_b_browns_gallons`?
- Is it using COALESCE to handle NULLs?
- Is it including both "Browns Bin" and "Adding Material" tables?
- Is it using LEFT JOIN or INNER JOIN?

### Step 2: Test Direct Query for Q4 2025

Run in Supabase SQL Editor:
```sql
-- Test Q4 2025 browns gallons manually
SELECT 
  -- From "Browns Bin" table
  SUM(COALESCE(bb.bin_a_browns_gallons, 0) + COALESCE(bb.bin_b_browns_gallons, 0)) as browns_bin_total,
  
  -- From "Adding Material" table
  SUM(COALESCE(am.browns_gallons, 0)) as adding_material_browns,
  
  -- Combined total
  SUM(COALESCE(bb.bin_a_browns_gallons, 0) + COALESCE(bb.bin_b_browns_gallons, 0)) + 
  SUM(COALESCE(am.browns_gallons, 0)) as total_browns_gallons

FROM "Form Submission" fs
LEFT JOIN "Browns Bin" bb ON bb.submission_id = fs.submission_id
LEFT JOIN "Adding Material" am ON am.submission_id = fs.submission_id
WHERE fs.timestamp >= '2025-10-01' 
  AND fs.timestamp < '2026-01-01';
```

**Compare results:**
- Should get ~514 gallons total (Elisa's manual calculation)
- If browns_bin_total is ~270 → function is only summing one bin
- If total is less than 514 → function is missing one of the tables

### Step 3: Test Each Bin Separately

```sql
-- Test bin_a only
SELECT SUM(COALESCE(bb.bin_a_browns_gallons, 0)) as bin_a_total
FROM "Browns Bin" bb
JOIN "Form Submission" fs ON bb.submission_id = fs.submission_id
WHERE fs.timestamp >= '2025-10-01' AND fs.timestamp < '2026-01-01';

-- Test bin_b only
SELECT SUM(COALESCE(bb.bin_b_browns_gallons, 0)) as bin_b_total
FROM "Browns Bin" bb
JOIN "Form Submission" fs ON bb.submission_id = fs.submission_id
WHERE fs.timestamp >= '2025-10-01' AND fs.timestamp < '2026-01-01';
```

**If bin_a_total ≈ 270, then the function is only summing bin_a!**

---

## Conclusion

### Is It An Import Issue or Backend Code Issue?

**✅ BACKEND CODE ISSUE (SQL Function)**

**Evidence:**
1. ✅ Q1-Q3 2025 are correct (import worked fine)
2. ✅ Q4 2025 is wrong (website-entered data)
3. ✅ Frontend code correctly sums both bins
4. ✅ Import data structure is correct
5. ✅ Backend TypeScript code just calls SQL function (no calculation logic)

**The bug is in the SQL function `dnrec_report()` in Supabase database.**

**Most Likely Issue:**
The SQL function is only summing `bin_a_browns_gallons` and missing `bin_b_browns_gallons`, OR it's not properly handling NULL values, causing bin_b values to be excluded.

**Fix Required:**
Update the SQL function to:
1. Sum both `bin_a_browns_gallons` and `bin_b_browns_gallons` with COALESCE
2. Include browns from both "Browns Bin" AND "Adding Material" tables
3. Use LEFT JOIN to include all submissions

---

## Next Steps

1. **Access Supabase SQL Editor** and view the `dnrec_report()` function definition
2. **Compare function logic** to the expected behavior outlined above
3. **Run test queries** to confirm the issue (bin_a only vs both bins)
4. **Fix the SQL function** to sum both bins correctly
5. **Test with Q4 2025 data** to verify it matches Elisa's manual calculation of 514 gallons