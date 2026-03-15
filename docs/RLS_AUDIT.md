# Row Level Security (RLS) Audit – DCCI Supabase

## Why RLS matters

Supabase uses the **anon** key in the browser. Without RLS, anyone with the anon key could read or write any table. RLS ensures that only the rows allowed by your policies are visible or writable.

## How to verify RLS is active

1. **Supabase Dashboard**  
   Go to **Database → Tables**, select a table, and open the **RLS** tab.  
   - **RLS enabled** should be **ON** for all tables that hold sensitive or staff-only data.

2. **Tables that should have RLS**
   - `Form Submission`
   - `Site`
   - `Measurements`
   - `Adding Material`
   - `Moving Day`
   - `Finished Compost`
   - `Browns Bin`
   - `Issues`
   - `Litter`
   - `alert_email_recipients`
   - Any storage buckets used for PDFs (e.g. DNREC reports)

3. **Quick test (authenticated vs anon)**  
   - With RLS **enabled** and correct policies:  
     - Unauthenticated (anon): public form can INSERT into form-related tables if you have policies allowing it; dashboard tables should be **read/write only for authenticated** users.  
     - Authenticated: dashboard can SELECT/UPDATE/DELETE according to your policies.  
   - With RLS **disabled**: anon could read/write everything (insecure).

## Recommended policy pattern for DCCI

- **Form Submission and task tables (Measurements, Adding Material, etc.)**  
  - **INSERT**: allow anon (or a dedicated “form” role) so the public compost form can submit.  
  - **SELECT / UPDATE / DELETE**: allow only `auth.role() = 'authenticated'` so only logged-in staff can view or edit.

- **Site, alert_email_recipients**  
  - **SELECT**: authenticated only (dashboard needs to read).  
  - **INSERT / UPDATE / DELETE**: authenticated only (staff manage these).

- **Storage buckets**  
  - **SELECT**: public or authenticated, depending on whether PDFs are public.  
  - **INSERT / UPDATE / DELETE**: authenticated only.

## Apply or fix RLS (Supabase SQL Editor)

Run the SQL in `supabase/migrations/YYYYMMDD_enable_rls.sql` (or the equivalent below) in the Supabase project’s **SQL Editor** to enable RLS and attach basic policies. Adjust table names and policy names to match your schema (e.g. quoted names like `"Form Submission"`).

After running:

1. Turn **RLS** **ON** for each table that stores sensitive or staff-only data.  
2. Add policies so:  
   - Public form can only **insert** into submission/task tables.  
   - Only **authenticated** users can read/update/delete those and manage sites/recipients.

Re-run the audit steps above to confirm RLS is active and behavior matches expectations.
