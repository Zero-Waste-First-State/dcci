# DCCI Composting Calculations Guide

## 📊 How We Calculate Composting Data

This guide explains how the DCCI composting application calculates weights, volumes, and environmental impact. All calculations follow DCCI's proven methods for accurate reporting.

---

## **What We Track**

The DCCI (Delaware Community Composting Initiative) system, operated by [Plastic Free Delaware](https://plasticfreedelaware.org), tracks three main types of materials:

1. **Greens** - Food scraps, kitchen waste, fresh plant material, grass clippings
2. **Browns** - Dry leaves, wood chips, straw, dry yard waste, paper products
3. **Finished Compost** - The final product ready for use by community members

This system supports Plastic Free Delaware's mission to address Delaware's plastic pollution and waste by providing community-based composting solutions across the state.

---

## ⚖️ **Weight Calculation Methods**

### **Greens Weight Calculation**

**What we measure:** Food scraps, kitchen waste, fresh plant material, and grass clippings added to DCCI composting bins

**How we calculate it:**
```
Final Greens Weight = Raw Weight - Bucket Weight
```

**Example:**
- Someone brings 10.5 pounds of food scraps and kitchen waste
- The bucket weighs 1.8 pounds
- **Final weight = 10.5 - 1.8 = 8.7 pounds**

**Why we subtract bucket weight:** We only want to count the actual compostable material, not the container.

**What counts as greens in DCCI:**
- Fruit and vegetable scraps
- Coffee grounds and filters
- Tea bags (paper only)
- Eggshells
- Fresh grass clippings
- Plant trimmings
- Bread and grain products

### **Browns Weight Calculation**

**What we measure:** Dry leaves, wood chips, straw, dry yard waste, and paper products added to DCCI composting bins

**How we calculate it:**
```
Final Browns Weight = (Gallons × 1.2) - Bucket Weight
```

**Example:**
- Someone adds 15 gallons of dry leaves
- Convert to pounds: 15 × 1.2 = 18 pounds
- Subtract bucket weight: 18 - 1.8 = 16.2 pounds
- **Final weight = 16.2 pounds**

**Why 1.2 pounds per gallon:** Dry leaves and wood chips are lighter than water, so 1 gallon weighs about 1.2 pounds.

**What counts as browns in DCCI:**
- Dry leaves
- Wood chips and sawdust
- Straw and hay
- Shredded paper and cardboard
- Dry grass clippings
- Pine needles
- Corn stalks

### **Finished Compost Volume**

**What we measure:** Finished compost taken from DCCI sites by community members for their gardens and landscaping

**How we report it:**
```
Compost Volume = Gallons (no weight conversion)
```

**Example:**
- Someone takes 5 gallons of finished compost from a DCCI site
- **Volume = 5 gallons** (reported in gallons only)

**Why gallons only:** DCCI requirement - finished compost is only reported in volume, not converted to weight.

**What this represents:**
- Mature, finished compost ready for garden use
- Material that has completed the composting process
- Community resource distributed back to participants
- End product of the DCCI composting cycle

---

## 📈 **Dashboard Statistics**

### **Daily Weight Tracking**

**File Location:** `components/weight-distribution-graph.tsx`, `components/daily-calendar.tsx`

The dashboard shows daily activity with two main numbers:

- **📥 Added:** Total weight of greens + browns added that day
- **📤 Removed:** Total weight of finished compost taken that day
- **📊 Net:** Added weight minus removed weight

### **Environmental Impact Calculations**

**File Location:** `components/impact-statistics.tsx`

The system calculates environmental benefits using conservative estimates and EPA data:

#### **Food Scraps Diverted Calculation**
```
Food Scraps Diverted = Greens Processed × 98% × 100%
```
- **98%** = DCCI requirement: 98% of greens are food scraps
- **100%** = All food scraps diverted from landfill (same as food scraps percentage)
- **Example:** 100 lbs greens → 100 × 0.98 × 1.0 = **98 lbs food scraps diverted**
- **File Location:** `components/impact-statistics.tsx` lines 32-33

#### **CO₂ Saved Calculation**
```
CO₂ Saved = Food Scraps Diverted × 0.5 lbs CO₂ per lb
```
- **0.5 lbs CO₂ per lb** = EPA estimate for methane reduction from food waste diversion
- **Example:** 37.5 lbs food scraps → 37.5 × 0.5 = **18.75 lbs CO₂ saved**
- **File Location:** `components/impact-statistics.tsx` line 34

#### **Gas Conserved Calculation**
```
Gas Conserved = Food Scraps Diverted × 0.1 gallons per lb
```
- **0.1 gallons per lb** = Estimated transportation fuel savings from local composting
- **Example:** 37.5 lbs food scraps → 37.5 × 0.1 = **3.75 gallons gas conserved**
- **File Location:** `components/impact-statistics.tsx` line 35

#### **Waste Diverted**
- **Total Material:** All greens + browns processed through DCCI sites (with bucket adjustments)
- **Greens:** Food scraps, kitchen waste, fresh plant material, and grass clippings
- **Browns:** Dry leaves, wood chips, straw, dry yard waste, and paper products
- **Compost Created:** Finished compost taken from DCCI sites by community members (in gallons)
- **File Location:** `components/impact-statistics.tsx` lines 101-128

---

## 🔢 **Key Numbers We Use**

| Material | Conversion Rate | Bucket Weight | File Location |
|----------|----------------|---------------|---------------|
| **Greens** | 1:1 (weighed directly) | 1.8 pounds | `components/impact-statistics.tsx` |
| **Browns** | 1 gallon = 1.2 pounds | 1.8 pounds | `components/weight-distribution-graph.tsx` |
| **Compost** | Volume only (gallons) | N/A | `components/finished-compost-table.tsx` |

### **Environmental Impact Constants**

| Factor | Value | Source | File Location |
|--------|-------|--------|---------------|
| **Food Scraps %** | 98% of greens | DCCI requirement | `components/impact-statistics.tsx` line 32 |
| **Landfill Diversion %** | 100% diverted from landfill | All food scraps diverted | `components/impact-statistics.tsx` line 33 |
| **CO₂ per lb food scraps** | 0.5 lbs CO₂ | EPA estimate | `components/impact-statistics.tsx` line 34 |
| **Gas per lb food scraps** | 0.1 gallons | Transportation estimate | `components/impact-statistics.tsx` line 35 |

---

## 📋 **How Data Flows Through the System**

### **1. Data Collection**
**File Location:** `components/submit-form.tsx`
- Volunteers record their activities using the mobile form
- System captures: weights, volumes, dates, and locations
- Data is validated and stored in Supabase database

### **2. Data Processing**
**File Location:** `components/impact-statistics.tsx`, `components/weight-distribution-graph.tsx`
- Raw data is cleaned and organized
- Weight calculations are applied using DCCI methods
- Bucket weights are automatically subtracted
- Environmental impact calculations are performed

### **3. Dashboard Display**
**File Location:** `components/daily-calendar.tsx`, `components/impact-statistics.tsx`
- Daily, weekly, and monthly summaries
- Environmental impact calculations
- Site-specific and organization-wide statistics
- Real-time updates as new data is added

### **4. DNREC Reporting**
**File Location:** `app/api/dnrec/pdf/route.tsx`, `app/api/dnrec/pdf/DnrecPdf.tsx`
- Quarterly reports for regulatory compliance
- Same calculation methods
- Automatic generation from DNREC button

---

## 🔍 **Example: Complete Calculation**

**Scenario:** A volunteer visits the composting site

**What they do:**
1. Adds 12.3 pounds of food scraps (greens)
2. Adds 8 gallons of dry leaves (browns)  
3. Takes 3 gallons of finished compost

**How we calculate:**

**Greens:**
- Raw weight: 12.3 pounds
- Minus bucket: 12.3 - 1.8 = **10.5 pounds**

**Browns:**
- Volume: 8 gallons
- Convert to weight: 8 × 1.2 = 9.6 pounds
- Minus bucket: 9.6 - 1.8 = **7.8 pounds**

**Compost taken:**
- Volume: 3 gallons (no weight conversion)

**Daily totals:**
- **Added:** 10.5 + 7.8 = **18.3 pounds**
- **Removed:** **3 gallons** (finished compost volume)
- **Net:** 18.3 - (3 × 8.34) = **-6.72 pounds** (more taken than added, converted for comparison)

**Environmental Impact Calculation:**
- **Food Scraps Diverted:** 10.5 × 0.98 × 1.0 = **10.29 pounds**
- **CO₂ Saved:** 10.29 × 0.5 = **5.15 pounds**
- **Gas Conserved:** 10.29 × 0.1 = **1.03 gallons**

---

## **How the Math is Used in Practice**

### **Dashboard Statistics Display**
The environmental impact calculations are used in the main dashboard to show:
- Total food scraps diverted from landfills
- CO₂ emissions prevented
- Gas conserved through local composting
- Year-to-date progress tracking

**Where to find this:** `components/impact-statistics.tsx` lines 101-135

### **DNREC Report Generation**
The same calculation methods are used when generating official DNREC reports, ensuring consistency between dashboard displays and regulatory reporting.

**Where to find this:** `app/api/dnrec/pdf/route.tsx` lines 32-49

### **Real-time Updates**
All calculations happen automatically when new data is submitted through the volunteer form. The system:
1. Fetches new submission data from the database
2. Applies weight adjustments (bucket weight subtraction)
3. Calculates environmental impact using the formulas above
4. Updates dashboard displays in real-time

**Where to find this:** `components/impact-statistics.tsx` lines 46-158

### **Data Processing Flow**
1. **Raw Data Collection:** Volunteers submit weights and volumes through the form
2. **Weight Adjustment:** System subtracts bucket weights automatically
3. **Environmental Calculation:** Applies EPA-aligned percentages to estimate impact
4. **Display Update:** Dashboard shows updated statistics immediately

**Key Files for Data Processing:**
- `components/submit-form.tsx` - Data collection and validation
- `components/impact-statistics.tsx` - Main calculation engine
- `components/weight-distribution-graph.tsx` - Daily weight tracking
- `components/daily-calendar.tsx` - Activity display with calculations

### **2024 DNREC Constants Implementation**
The system uses hardcoded 2024 DNREC final results as constants for total statistics while using live database data for year-to-date calculations.

**How it works:**
- **Total Statistics:** Uses 2024 DNREC final results from `lib/constants.ts`
- **Year-to-Date Statistics:** Uses live database queries for current year data
- **DNREC Reports:** When generating 2024 reports, bypasses database and uses constants directly

**Where to find this:**
- `lib/constants.ts` lines 5-28 - DNREC 2024 final results constants
- `components/impact-statistics.tsx` lines 102, 123 - Usage of constants for total stats
- `app/api/dnrec/pdf/route.tsx` lines 32-49 - DNREC report generation logic

**Constants used:**
- Greens: 1,731.58 pounds, 394.94 gallons
- Browns: 1,600.87 pounds, 1,664 gallons  
- Finished compost: 55 gallons
- Ancillary wastes: 4 units

---

## **Technical Details**

### **Database Structure**
**File Location:** `lib/supabase/client.ts`, `SUPABASE_README.md`
- All calculations are stored in Supabase database
- Data is organized by submission, site, and date
- Relationships ensure data integrity
- Tables: Form Submission, Adding Material, Browns Bin, Finished Compost, Measurements

### **Real-time Updates**
**File Location:** `components/impact-statistics.tsx`, `components/weight-distribution-graph.tsx`
- Dashboard updates automatically as new data is added
- Calculations happen in real-time using React hooks
- No manual processing required
- Data is fetched from Supabase on component mount

### **Data Validation**
**File Location:** `components/submit-form.tsx`
- System checks for reasonable values
- Prevents data entry errors
- Maintains calculation accuracy
- Form validation ensures data quality

### **DNREC Report Generation**
**File Location:** `app/api/dnrec/pdf/route.tsx`, `components/dnrec-report-button.tsx`
- SQL function `public.dnrec_report()` calculates quarterly data
- PDF generation using `@react-pdf/renderer`
- Automatic bucket weight adjustments
- Regulatory compliance reporting

---

## 📁 **Key File Locations Summary**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **Impact Statistics** | `components/impact-statistics.tsx` | Main dashboard statistics and environmental calculations |
| **Weight Distribution Graph** | `components/weight-distribution-graph.tsx` | Daily weight tracking with DCCI calculations |
| **Daily Calendar** | `components/daily-calendar.tsx` | Daily activity display with weight calculations |
| **Submit Form** | `components/submit-form.tsx` | Data collection and validation |
| **Finished Compost Table** | `components/finished-compost-table.tsx` | Compost weight calculations |
| **DNREC Report Button** | `components/dnrec-report-button.tsx` | Report generation interface |
| **DNREC PDF Route** | `app/api/dnrec/pdf/route.tsx` | Backend report generation |
| **DNREC PDF Component** | `app/api/dnrec/pdf/DnrecPdf.tsx` | PDF layout and formatting |
| **Supabase Client** | `lib/supabase/client.ts` | Database connection |
| **Database Schema** | `SUPABASE_README.md` | Database structure documentation |