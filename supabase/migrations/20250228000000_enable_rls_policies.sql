-- DCCI Row Level Security (RLS) – enable and attach policies
-- Run this in Supabase Dashboard → SQL Editor for your project.
-- If policies already exist, drop them first or run only the ALTER TABLE ... ENABLE ROW LEVEL SECURITY lines.
-- Adjust table names if your schema uses different identifiers (e.g. "Form Submission").

-- Enable RLS on tables that should be protected.
-- (Skip or comment out tables that don’t exist in your schema.)

ALTER TABLE "Form Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Measurements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Adding Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Moving Day" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finished Compost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Browns Bin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Issues" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Litter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_email_recipients ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (public form) to INSERT into form submission and task tables only.
-- Adjust table names to match your schema.

CREATE POLICY "Allow anon insert Form Submission"
  ON "Form Submission" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Measurements"
  ON "Measurements" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Adding Material"
  ON "Adding Material" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Moving Day"
  ON "Moving Day" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Finished Compost"
  ON "Finished Compost" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Browns Bin"
  ON "Browns Bin" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Issues"
  ON "Issues" FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon insert Litter"
  ON "Litter" FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users (staff) to read and manage all form/site/recipient data.

CREATE POLICY "Allow authenticated read Form Submission"
  ON "Form Submission" FOR SELECT TO authenticated USING (true);

-- Public form needs to read sites for site selection dropdown
CREATE POLICY "Allow anon read Site"
  ON "Site" FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read Site"
  ON "Site" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Site"
  ON "Site" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Measurements"
  ON "Measurements" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Measurements"
  ON "Measurements" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Adding Material"
  ON "Adding Material" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Adding Material"
  ON "Adding Material" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Moving Day"
  ON "Moving Day" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Moving Day"
  ON "Moving Day" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Finished Compost"
  ON "Finished Compost" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Finished Compost"
  ON "Finished Compost" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Browns Bin"
  ON "Browns Bin" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Browns Bin"
  ON "Browns Bin" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Issues"
  ON "Issues" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Issues"
  ON "Issues" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read Litter"
  ON "Litter" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated all Litter"
  ON "Litter" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated all alert_email_recipients"
  ON alert_email_recipients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- If your app uses service role for form submission server-side, you may not need anon INSERT.
-- If forms submit from the client with anon key, keep the anon INSERT policies above.
