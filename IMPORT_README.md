# DCCI Data Import Guide

## Overview

This guide explains how to import historical data into the DCCI composting system and ensure database sequences are properly configured for continued operation.

## Prerequisites

- Access to Supabase SQL Editor
- CSV files with historical data
- Understanding of database sequences and auto-incrementing IDs

## Data Import Process

### Step 1: Prepare CSV Files

Ensure your CSV files contain the following data:

- `form_submissions.csv` - Main submission records
- `adding_material.csv` - Greens and material addition data
- `browns_bin.csv` - Browns bin management data
- `measurements.csv` - Temperature and moisture measurements
- `finished_compost.csv` - Compost collection data
- `moving_day.csv` - Bin movement operations

### Step 2: Import Data via Supabase

1. **Access Supabase Dashboard**
   - Navigate to your DCCI project
   - Go to Table Editor
   - Select each table and use the import function

2. **Import Order**
   - Import `Form Submission` first (contains primary keys)
   - Import task-specific tables in any order
   - Verify all data imported correctly

### Step 3: Critical - Update Database Sequences

**This is the most important step and must be completed after importing data.**

When you import data with specific IDs, the database sequences don't automatically update. This means new records will start from ID 1, causing conflicts with existing data.

#### Why This Matters

- **Without sequence updates**: New submissions will get IDs 1, 2, 3... (conflicting with imported data)
- **With sequence updates**: New submissions will get IDs 163, 164, 165... (continuing from imported data)

#### How to Update Sequences

Run this SQL script in your Supabase SQL Editor:

```sql
-- Update database sequences to correct next values
-- Based on current maximum IDs from 2025 import data

-- Form Submission sequence
SELECT setval('"Form Submission_submission_id_seq"', 162, true);

-- Adding Material sequence  
SELECT setval('"Bin 1 (Lasagna Layer)_bin1_id_seq"', 111, true);

-- Browns Bin sequence
SELECT setval('"Browns Bin_browns_id_seq"', 21, true);

-- Measurements sequence
SELECT setval('"Measurements_measurement_id_seq"', 75, true);

-- Finished Compost sequence
SELECT setval('"Finished Compost_compost_id_seq"', 17, true);

-- Moving Day sequence
SELECT setval('"Moving Day_moving_id_seq"', 11, true);
```

#### Verify Sequences Are Set Correctly

Run this verification query:

```sql
-- Verify the sequences are set correctly
SELECT 'Form Submission' as table_name, nextval('"Form Submission_submission_id_seq"') as next_id
UNION ALL
SELECT 'Adding Material', nextval('"Bin 1 (Lasagna Layer)_bin1_id_seq"')
UNION ALL
SELECT 'Browns Bin', nextval('"Browns Bin_browns_id_seq"')
UNION ALL
SELECT 'Measurements', nextval('"Measurements_measurement_id_seq"')
UNION ALL
SELECT 'Finished Compost', nextval('"Finished Compost_compost_id_seq"')
UNION ALL
SELECT 'Moving Day', nextval('"Moving Day_moving_id_seq"');
```

**Expected Results:**
- Form Submission: 163
- Adding Material: 112  
- Browns Bin: 22
- Measurements: 76
- Finished Compost: 18
- Moving Day: 12

**Note:** The `nextval()` calls above will increment the sequences, so these are the actual next IDs that will be assigned to new records.

## Understanding Database Sequences

### What Are Sequences?

Database sequences are auto-incrementing counters that generate unique IDs for new records. Each table with an auto-incrementing primary key has an associated sequence.

### How setval() Works

```sql
SELECT setval('sequence_name', value, true);
```

- **sequence_name**: The name of the sequence to update
- **value**: The last value that was used (maximum ID from imported data)
- **true**: Indicates the sequence has been used (next call to nextval() will return value + 1)

### Example

If your imported data has submission IDs 1 through 162:
- Run: `SELECT setval('"Form Submission_submission_id_seq"', 162, true);`
- Next new record will get ID: 163
- Following records will get IDs: 164, 165, 166...

## Troubleshooting

### Problem: New records getting duplicate IDs

**Symptoms:**
- Error messages about duplicate primary keys
- New submissions getting IDs that already exist

**Solution:**
- Check if sequences were updated after import
- Run the sequence update script
- Verify with the verification query

### Problem: Sequences set too high

**Symptoms:**
- Large gaps in ID numbers
- New records starting from unexpectedly high numbers

**Solution:**
- Check the actual maximum ID in your data
- Update sequences to the correct maximum value
- Use the verification query to confirm

### Problem: Import failed due to ID conflicts

**Symptoms:**
- Import process fails with primary key violations
- Some records imported, others failed

**Solution:**
- Clear the table and re-import
- Ensure CSV files have sequential IDs starting from 1
- Update sequences after successful import

## Best Practices

### Before Importing

1. **Backup your database** - Always create a backup before major data operations
2. **Verify CSV format** - Ensure all required columns are present
3. **Check ID ranges** - Confirm the maximum ID in your import data

### After Importing

1. **Update sequences immediately** - Don't wait, do this right after import
2. **Test with a new record** - Create a test submission to verify sequences work
3. **Verify all tables** - Check that all imported data is present and correct

### Ongoing Maintenance

1. **Monitor sequence values** - Periodically check that sequences are reasonable
2. **Document changes** - Keep track of when sequences are updated
3. **Regular backups** - Maintain current backups of your data

## File Locations

- **Import Scripts**: `2025_import_data/` directory
- **Sequence Update Script**: Copy from this README
- **Database Schema**: `SUPABASE_README.md`
- **Calculation Methods**: `DCCI_CALCULATIONS_README.md`

## Support

If you encounter issues during the import process:

1. **Check the logs** - Review Supabase logs for error messages
2. **Verify data format** - Ensure CSV files match expected schema
3. **Test sequences** - Use the verification query to check sequence values
4. **Contact support** - Reach out if you need assistance with the import process

## Quick Reference

### Essential Commands

```sql
-- Check current sequence values
SELECT last_value FROM "Form Submission_submission_id_seq";

-- Update a sequence
SELECT setval('"Form Submission_submission_id_seq"', 162, true);

-- Get next ID (increments sequence)
SELECT nextval('"Form Submission_submission_id_seq"');
```

### Critical Reminder

**Always update sequences after importing data with specific IDs. This is essential for preventing ID conflicts and ensuring the system continues to work correctly.**
