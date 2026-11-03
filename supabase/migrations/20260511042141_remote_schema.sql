

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "reporting";


ALTER SCHEMA "reporting" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."dnrec_report"("year_input" integer DEFAULT (EXTRACT(year FROM "now"()))::integer) RETURNS TABLE("quarter" "text", "total_composted_green_lbs" numeric, "total_green_gallons" numeric, "estimated_browns_lbs" numeric, "total_browns_gallons" numeric, "total_finished_compost_gallons" numeric, "ancillary_wastes_qty" bigint, "deviations_noncompliance_description" "text")
    LANGUAGE "sql" STABLE
    AS $$
WITH params AS (
  SELECT
    year_input AS yr,
    make_date(year_input, 1, 1)     AS y_start,
    make_date(year_input + 1, 1, 1) AS y_end
),

submissions_with_quarter AS (
  SELECT 
    fs.submission_id,
    fs."timestamp",
    CASE
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 1, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 4, 1) THEN 'Quarter 1'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 4, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 7, 1) THEN 'Quarter 2'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 7, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 10, 1) THEN 'Quarter 3'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params),10, 1) AND fs."timestamp" < make_date((SELECT yr FROM params)+1,1, 1) THEN 'Quarter 4'
    END AS quarter
  FROM public."Form Submission" fs
  WHERE fs."timestamp" >= (SELECT y_start FROM params)
    AND fs."timestamp" <  (SELECT y_end   FROM params)
),

greens_lbs AS (
  SELECT
    swq.quarter,
    SUM(am.greens_pounds) - (COUNT(am.greens_pounds) * 1.8) AS total_composted_green_lbs
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_pounds > 0
  GROUP BY swq.quarter
),

greens_gallons AS (
  SELECT
    swq.quarter,
    SUM(am.greens_gallons) AS total_green_gallons
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_gallons > 0
  GROUP BY swq.quarter
),

browns_lbs AS (
  SELECT
    swq.quarter,
    (SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) * 1.2) 
    - (COUNT(*) FILTER (WHERE bb.bin_a_browns_gallons > 0 OR bb.bin_b_browns_gallons > 0) * 1.8) AS estimated_browns_lbs
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

browns_gallons AS (
  SELECT
    swq.quarter,
    SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) AS total_browns_gallons
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

finished_compost_gallons AS (
  SELECT
    swq.quarter,
    SUM(fc.gallons_compost_taken) AS total_finished_compost_gallons
  FROM public."Finished Compost" fc
  JOIN submissions_with_quarter swq ON fc.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

issues_by_quarter AS (
  SELECT 
    swq.quarter,
    COUNT(l.litter_id) AS ancillary_wastes_qty
  FROM public."Litter" l
  JOIN submissions_with_quarter swq ON l.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

combined_quarters AS (
  SELECT
    q.quarter,
    COALESCE(gl.total_composted_green_lbs, 0) AS total_composted_green_lbs,
    COALESCE(gg.total_green_gallons, 0)       AS total_green_gallons,
    COALESCE(bl.estimated_browns_lbs, 0)      AS estimated_browns_lbs,
    COALESCE(bg.total_browns_gallons, 0)      AS total_browns_gallons,
    COALESCE(fc.total_finished_compost_gallons, 0) AS total_finished_compost_gallons,
    COALESCE(iq.ancillary_wastes_qty, 0)      AS ancillary_wastes_qty
  FROM (VALUES ('Quarter 1'), ('Quarter 2'), ('Quarter 3'), ('Quarter 4')) AS q(quarter)
  LEFT JOIN greens_lbs           gl ON gl.quarter = q.quarter
  LEFT JOIN greens_gallons       gg ON gg.quarter = q.quarter
  LEFT JOIN browns_lbs           bl ON bl.quarter = q.quarter
  LEFT JOIN browns_gallons       bg ON bg.quarter = q.quarter
  LEFT JOIN finished_compost_gallons fc ON fc.quarter = q.quarter
  LEFT JOIN issues_by_quarter    iq ON iq.quarter = q.quarter
),

totals AS (
  SELECT
    'TOTAL' AS quarter,
    SUM(total_composted_green_lbs)    AS total_composted_green_lbs,
    SUM(total_green_gallons)          AS total_green_gallons,
    SUM(estimated_browns_lbs)         AS estimated_browns_lbs,
    SUM(total_browns_gallons)         AS total_browns_gallons,
    SUM(total_finished_compost_gallons) AS total_finished_compost_gallons,
    SUM(ancillary_wastes_qty)         AS ancillary_wastes_qty
  FROM combined_quarters
)

SELECT *
FROM (
  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    'n/a' AS deviations_noncompliance_description
  FROM combined_quarters

  UNION ALL

  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    'n/a' AS deviations_noncompliance_description
  FROM totals
) AS unified_results
ORDER BY 
  CASE quarter
    WHEN 'Quarter 1' THEN 1
    WHEN 'Quarter 2' THEN 2
    WHEN 'Quarter 3' THEN 3
    WHEN 'Quarter 4' THEN 4
    WHEN 'TOTAL' THEN 5
    ELSE 6
  END;
$$;


ALTER FUNCTION "public"."dnrec_report"("year_input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dnrec_report"("year_input" integer DEFAULT (EXTRACT(year FROM "now"()))::integer, "site_id_input" integer DEFAULT NULL::integer) RETURNS TABLE("quarter" "text", "total_composted_green_lbs" numeric, "total_green_gallons" numeric, "estimated_browns_lbs" numeric, "total_browns_gallons" numeric, "total_finished_compost_gallons" numeric, "ancillary_wastes_qty" bigint, "litter_instances" bigint, "deviations_noncompliance_description" "text")
    LANGUAGE "sql" STABLE
    AS $$
WITH params AS (
  SELECT
    year_input AS yr,
    make_date(year_input, 1, 1)     AS y_start,
    make_date(year_input + 1, 1, 1) AS y_end
),

submissions_with_quarter AS (
  SELECT 
    fs.submission_id,
    fs."timestamp",
    CASE
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 1, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 4, 1) THEN 'Quarter 1'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 4, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 7, 1) THEN 'Quarter 2'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 7, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 10, 1) THEN 'Quarter 3'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params),10, 1) AND fs."timestamp" < make_date((SELECT yr FROM params)+1,1, 1) THEN 'Quarter 4'
    END AS quarter
  FROM public."Form Submission" fs
  WHERE fs."timestamp" >= (SELECT y_start FROM params)
    AND fs."timestamp" <  (SELECT y_end   FROM params)
    AND (site_id_input IS NULL OR fs.site_id = site_id_input)
),

greens_lbs AS (
  SELECT
    swq.quarter,
    SUM(am.greens_pounds) - (COUNT(am.greens_pounds) * 1.8) AS total_composted_green_lbs
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_pounds > 0
  GROUP BY swq.quarter
),

greens_gallons AS (
  SELECT
    swq.quarter,
    SUM(am.greens_gallons) AS total_green_gallons
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_gallons > 0
  GROUP BY swq.quarter
),

browns_lbs AS (
  SELECT
    swq.quarter,
    (SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) * 1.2) 
    - (COUNT(*) FILTER (WHERE bb.bin_a_browns_gallons > 0 OR bb.bin_b_browns_gallons > 0) * 1.8) AS estimated_browns_lbs
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

browns_gallons AS (
  SELECT
    swq.quarter,
    SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) AS total_browns_gallons
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

finished_compost_gallons AS (
  SELECT
    swq.quarter,
    SUM(fc.gallons_compost_taken) AS total_finished_compost_gallons
  FROM public."Finished Compost" fc
  JOIN submissions_with_quarter swq ON fc.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

issues_by_quarter AS (
  SELECT 
    swq.quarter,
    COUNT(l.litter_id) AS ancillary_wastes_qty
  FROM public."Litter" l
  JOIN submissions_with_quarter swq ON l.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

litter_instances_by_quarter AS (
  SELECT 
    swq.quarter,
    COUNT(l.litter_id) AS litter_instances
  FROM public."Litter" l
  JOIN submissions_with_quarter swq ON l.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

combined_quarters AS (
  SELECT
    q.quarter,
    COALESCE(gl.total_composted_green_lbs, 0) AS total_composted_green_lbs,
    COALESCE(gg.total_green_gallons, 0)       AS total_green_gallons,
    COALESCE(bl.estimated_browns_lbs, 0)      AS estimated_browns_lbs,
    COALESCE(bg.total_browns_gallons, 0)      AS total_browns_gallons,
    COALESCE(fc.total_finished_compost_gallons, 0) AS total_finished_compost_gallons,
    COALESCE(iq.ancillary_wastes_qty, 0)      AS ancillary_wastes_qty,
    COALESCE(liq.litter_instances, 0)         AS litter_instances  
  FROM (VALUES ('Quarter 1'), ('Quarter 2'), ('Quarter 3'), ('Quarter 4')) AS q(quarter)
  LEFT JOIN greens_lbs           gl ON gl.quarter = q.quarter
  LEFT JOIN greens_gallons       gg ON gg.quarter = q.quarter
  LEFT JOIN browns_lbs           bl ON bl.quarter = q.quarter
  LEFT JOIN browns_gallons       bg ON bg.quarter = q.quarter
  LEFT JOIN finished_compost_gallons fc ON fc.quarter = q.quarter
  LEFT JOIN issues_by_quarter    iq ON iq.quarter = q.quarter
  LEFT JOIN litter_instances_by_quarter liq ON liq.quarter = q.quarter 
),

totals AS (
  SELECT
    'TOTAL' AS quarter,
    SUM(total_composted_green_lbs)    AS total_composted_green_lbs,
    SUM(total_green_gallons)          AS total_green_gallons,
    SUM(estimated_browns_lbs)         AS estimated_browns_lbs,
    SUM(total_browns_gallons)         AS total_browns_gallons,
    SUM(total_finished_compost_gallons) AS total_finished_compost_gallons,
    SUM(ancillary_wastes_qty)         AS ancillary_wastes_qty,
    SUM(litter_instances)             AS litter_instances  
  FROM combined_quarters
)

SELECT *
FROM (
  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    litter_instances,  
    'n/a' AS deviations_noncompliance_description
  FROM combined_quarters

  UNION ALL

  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    litter_instances, 
    'n/a' AS deviations_noncompliance_description
  FROM totals
) AS unified_results
ORDER BY 
  CASE quarter
    WHEN 'Quarter 1' THEN 1
    WHEN 'Quarter 2' THEN 2
    WHEN 'Quarter 3' THEN 3
    WHEN 'Quarter 4' THEN 4
    WHEN 'TOTAL' THEN 5
    ELSE 6
  END;
$$;


ALTER FUNCTION "public"."dnrec_report"("year_input" integer, "site_id_input" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "reporting"."dnrec_report"("year_input" integer DEFAULT (EXTRACT(year FROM "now"()))::integer) RETURNS TABLE("quarter" "text", "total_composted_green_lbs" numeric, "total_green_gallons" numeric, "estimated_browns_lbs" numeric, "total_browns_gallons" numeric, "total_finished_compost_gallons" numeric, "ancillary_wastes_qty" bigint, "deviations_noncompliance_description" "text")
    LANGUAGE "sql" STABLE
    AS $$
WITH params AS (
  SELECT
    year_input AS yr,
    make_date(year_input, 1, 1)     AS y_start,
    make_date(year_input + 1, 1, 1) AS y_end
),

submissions_with_quarter AS (
  SELECT 
    fs.submission_id,
    fs."timestamp",
    CASE
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 1, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 4, 1) THEN 'Quarter 1'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 4, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 7, 1) THEN 'Quarter 2'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params), 7, 1) AND fs."timestamp" < make_date((SELECT yr FROM params), 10, 1) THEN 'Quarter 3'
      WHEN fs."timestamp" >= make_date((SELECT yr FROM params),10, 1) AND fs."timestamp" < make_date((SELECT yr FROM params)+1,1, 1) THEN 'Quarter 4'
    END AS quarter
  FROM public."Form Submission" fs
  WHERE fs."timestamp" >= (SELECT y_start FROM params)
    AND fs."timestamp" <  (SELECT y_end   FROM params)
),

greens_lbs AS (
  SELECT
    swq.quarter,
    SUM(am.greens_pounds) - (COUNT(am.greens_pounds) * 1.8) AS total_composted_green_lbs
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_pounds > 0
  GROUP BY swq.quarter
),

greens_gallons AS (
  SELECT
    swq.quarter,
    SUM(am.greens_gallons) AS total_green_gallons
  FROM public."Adding Material" am
  JOIN submissions_with_quarter swq ON am.submission_id = swq.submission_id
  WHERE am.greens_gallons > 0
  GROUP BY swq.quarter
),

browns_lbs AS (
  SELECT
    swq.quarter,
    (SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) * 1.2) 
    - (COUNT(*) FILTER (WHERE bb.bin_a_browns_gallons > 0 OR bb.bin_b_browns_gallons > 0) * 1.8) AS estimated_browns_lbs
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

browns_gallons AS (
  SELECT
    swq.quarter,
    SUM(bb.bin_a_browns_gallons + bb.bin_b_browns_gallons) AS total_browns_gallons
  FROM public."Browns Bin" bb
  JOIN submissions_with_quarter swq ON bb.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

finished_compost_gallons AS (
  SELECT
    swq.quarter,
    SUM(fc.gallons_compost_taken) AS total_finished_compost_gallons
  FROM public."Finished Compost" fc
  JOIN submissions_with_quarter swq ON fc.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

issues_by_quarter AS (
  SELECT 
    swq.quarter,
    COUNT(l.litter_id) AS ancillary_wastes_qty
  FROM public."Litter" l
  JOIN submissions_with_quarter swq ON l.submission_id = swq.submission_id
  GROUP BY swq.quarter
),

combined_quarters AS (
  SELECT
    q.quarter,
    COALESCE(gl.total_composted_green_lbs, 0) AS total_composted_green_lbs,
    COALESCE(gg.total_green_gallons, 0)       AS total_green_gallons,
    COALESCE(bl.estimated_browns_lbs, 0)      AS estimated_browns_lbs,
    COALESCE(bg.total_browns_gallons, 0)      AS total_browns_gallons,
    COALESCE(fc.total_finished_compost_gallons, 0) AS total_finished_compost_gallons,
    COALESCE(iq.ancillary_wastes_qty, 0)      AS ancillary_wastes_qty
  FROM (VALUES ('Quarter 1'), ('Quarter 2'), ('Quarter 3'), ('Quarter 4')) AS q(quarter)
  LEFT JOIN greens_lbs           gl ON gl.quarter = q.quarter
  LEFT JOIN greens_gallons       gg ON gg.quarter = q.quarter
  LEFT JOIN browns_lbs           bl ON bl.quarter = q.quarter
  LEFT JOIN browns_gallons       bg ON bg.quarter = q.quarter
  LEFT JOIN finished_compost_gallons fc ON fc.quarter = q.quarter
  LEFT JOIN issues_by_quarter    iq ON iq.quarter = q.quarter
),

totals AS (
  SELECT
    'TOTAL' AS quarter,
    SUM(total_composted_green_lbs)    AS total_composted_green_lbs,
    SUM(total_green_gallons)          AS total_green_gallons,
    SUM(estimated_browns_lbs)         AS estimated_browns_lbs,
    SUM(total_browns_gallons)         AS total_browns_gallons,
    SUM(total_finished_compost_gallons) AS total_finished_compost_gallons,
    SUM(ancillary_wastes_qty)         AS ancillary_wastes_qty
  FROM combined_quarters
)

SELECT *
FROM (
  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    'n/a' AS deviations_noncompliance_description
  FROM combined_quarters

  UNION ALL

  SELECT 
    quarter, 
    total_composted_green_lbs, 
    total_green_gallons, 
    estimated_browns_lbs, 
    total_browns_gallons, 
    total_finished_compost_gallons,
    ancillary_wastes_qty,
    'n/a' AS deviations_noncompliance_description
  FROM totals
) AS unified_results
ORDER BY 
  CASE quarter
    WHEN 'Quarter 1' THEN 1
    WHEN 'Quarter 2' THEN 2
    WHEN 'Quarter 3' THEN 3
    WHEN 'Quarter 4' THEN 4
    WHEN 'TOTAL' THEN 5
    ELSE 6
  END;
$$;


ALTER FUNCTION "reporting"."dnrec_report"("year_input" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Adding Material" (
    "bin_id" bigint NOT NULL,
    "submission_id" bigint NOT NULL,
    "greens_gallons" double precision,
    "browns_gallons" double precision,
    "red_line" boolean,
    "bin_type" double precision,
    "greens_pounds" double precision
);


ALTER TABLE "public"."Adding Material" OWNER TO "postgres";


ALTER TABLE "public"."Adding Material" ALTER COLUMN "bin_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Bin 1 (Lasagna Layer)_bin1_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Browns Bin" (
    "browns_id" bigint NOT NULL,
    "submission_id" bigint,
    "bin_a_browns_gallons" double precision,
    "bin_b_browns_gallons" double precision,
    "bin_a_red_line" boolean,
    "bin_b_red_line" boolean
);


ALTER TABLE "public"."Browns Bin" OWNER TO "postgres";


ALTER TABLE "public"."Browns Bin" ALTER COLUMN "browns_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Browns Bin_browns_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Finished Compost" (
    "compost_id" bigint NOT NULL,
    "submission_id" bigint,
    "gallons_compost_taken" double precision
);


ALTER TABLE "public"."Finished Compost" OWNER TO "postgres";


ALTER TABLE "public"."Finished Compost" ALTER COLUMN "compost_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Finished Compost_compost_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Form Submission" (
    "submission_id" bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "site_id" bigint,
    "first_name" "text",
    "last_name" "text",
    "user_email" "text"
);


ALTER TABLE "public"."Form Submission" OWNER TO "postgres";


ALTER TABLE "public"."Form Submission" ALTER COLUMN "submission_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Form Submission_submission_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Issues" (
    "issue_id" bigint NOT NULL,
    "submission_id" bigint,
    "broken_tools" boolean,
    "bin_holes" boolean,
    "bad_odors" boolean,
    "fruit_flies_mice_other_vectors" boolean,
    "other" "text",
    "resolved" boolean DEFAULT false
);


ALTER TABLE "public"."Issues" OWNER TO "postgres";


ALTER TABLE "public"."Issues" ALTER COLUMN "issue_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Issues_issue_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Litter" (
    "litter_id" bigint NOT NULL,
    "submission_id" bigint,
    "bin_1_contaminated" boolean,
    "bin_2_contaminated" boolean,
    "bin_3_contaminated" boolean,
    "bin_4_contaminated" boolean,
    "plastic_trash" boolean,
    "food_stickers" boolean,
    "prohibited_organics" boolean,
    "other_trash" "text",
    "contamination_removed" boolean,
    "resolved" boolean DEFAULT false
);


ALTER TABLE "public"."Litter" OWNER TO "postgres";


ALTER TABLE "public"."Litter" ALTER COLUMN "litter_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Litter_litter_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Measurements" (
    "measurement_id" bigint NOT NULL,
    "submission_id" bigint NOT NULL,
    "bin_type" "text",
    "temp_left" double precision,
    "temp_middle" double precision,
    "temp_right" double precision,
    "left_squeeze" "text",
    "left_corrective_actions" "text",
    "middle_squeeze" "text",
    "middle_corrective_actions" "text",
    "right_squeeze" "text",
    "right_corrective_actions" "text",
    "mix" "text"
);


ALTER TABLE "public"."Measurements" OWNER TO "postgres";


ALTER TABLE "public"."Measurements" ALTER COLUMN "measurement_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Measurements_measurement_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Moving Day" (
    "moving_id" bigint NOT NULL,
    "submission_id" bigint,
    "move_bin1_bin2" boolean,
    "move_bin2_bin3" boolean,
    "move_bin3_bin4" boolean,
    "move_bin4_steel_bins" boolean
);


ALTER TABLE "public"."Moving Day" OWNER TO "postgres";


ALTER TABLE "public"."Moving Day" ALTER COLUMN "moving_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Moving Day_moving_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Site" (
    "site_id" bigint NOT NULL,
    "site_name" "text",
    "password" "text"
);


ALTER TABLE "public"."Site" OWNER TO "postgres";


ALTER TABLE "public"."Site" ALTER COLUMN "site_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Site_site_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."alert_email_recipients" (
    "id" bigint NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."alert_email_recipients" OWNER TO "postgres";


ALTER TABLE "public"."alert_email_recipients" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."alert_email_recipients_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."Adding Material"
    ADD CONSTRAINT "Bin 1 (Lasagna Layer) / Bin 2_pkey" PRIMARY KEY ("bin_id");



ALTER TABLE ONLY "public"."Browns Bin"
    ADD CONSTRAINT "Browns Bin_pkey" PRIMARY KEY ("browns_id");



ALTER TABLE ONLY "public"."Finished Compost"
    ADD CONSTRAINT "Finished Compost_pkey" PRIMARY KEY ("compost_id");



ALTER TABLE ONLY "public"."Form Submission"
    ADD CONSTRAINT "Form Submission_pkey" PRIMARY KEY ("submission_id");



ALTER TABLE ONLY "public"."Issues"
    ADD CONSTRAINT "Issues_pkey" PRIMARY KEY ("issue_id");



ALTER TABLE ONLY "public"."Litter"
    ADD CONSTRAINT "Litter_pkey" PRIMARY KEY ("litter_id");



ALTER TABLE ONLY "public"."Measurements"
    ADD CONSTRAINT "Measurements_pkey" PRIMARY KEY ("measurement_id");



ALTER TABLE ONLY "public"."Moving Day"
    ADD CONSTRAINT "Moving Day_pkey" PRIMARY KEY ("moving_id");



ALTER TABLE ONLY "public"."Site"
    ADD CONSTRAINT "Site_pkey" PRIMARY KEY ("site_id");



ALTER TABLE ONLY "public"."alert_email_recipients"
    ADD CONSTRAINT "alert_email_recipients_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."alert_email_recipients"
    ADD CONSTRAINT "alert_email_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Adding Material"
    ADD CONSTRAINT "Bin 1 (Lasagna Layer)_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Browns Bin"
    ADD CONSTRAINT "Browns Bin_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Finished Compost"
    ADD CONSTRAINT "Finished Compost_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Form Submission"
    ADD CONSTRAINT "Form Submission_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("site_id");



ALTER TABLE ONLY "public"."Issues"
    ADD CONSTRAINT "Issues_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Litter"
    ADD CONSTRAINT "Litter_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Measurements"
    ADD CONSTRAINT "Measurements_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE ONLY "public"."Moving Day"
    ADD CONSTRAINT "Moving Day_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."Form Submission"("submission_id");



ALTER TABLE "public"."Adding Material" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow Form Submission insert" ON "public"."Form Submission" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow Form Submission read" ON "public"."Form Submission" FOR SELECT USING (true);



CREATE POLICY "Allow Issues insert" ON "public"."Issues" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow adding brown bin" ON "public"."Browns Bin" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow general adding material" ON "public"."Adding Material" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert for Litter" ON "public"."Litter" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert for Moving Day" ON "public"."Moving Day" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow insert into Finished Compost" ON "public"."Finished Compost" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access to adding material" ON "public"."Adding Material" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to finished compost" ON "public"."Finished Compost" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to sites" ON "public"."Site" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to submissions" ON "public"."Form Submission" FOR SELECT USING (true);



CREATE POLICY "Allow public to read alert recipients" ON "public"."alert_email_recipients" FOR SELECT USING (true);



CREATE POLICY "Allow staff delete site" ON "public"."Site" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow users to insert measurements" ON "public"."Measurements" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."Browns Bin" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Dashboard adding sites" ON "public"."Site" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."Site" FOR SELECT USING (true);



ALTER TABLE "public"."Finished Compost" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Form Submission" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Litter" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Measurements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Moving Day" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Site" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alert_email_recipients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard allow all permissions for email resend" ON "public"."alert_email_recipients" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard delete adding" ON "public"."Adding Material" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete browns bin" ON "public"."Browns Bin" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete compost" ON "public"."Finished Compost" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete forms" ON "public"."Form Submission" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete issues" ON "public"."Issues" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete litter" ON "public"."Litter" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete measurements" ON "public"."Measurements" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard delete moving day" ON "public"."Moving Day" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "dashboard select measurements" ON "public"."Measurements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard select moving day" ON "public"."Moving Day" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard update" ON "public"."Site" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update adding" ON "public"."Adding Material" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update browns bin" ON "public"."Browns Bin" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update compost" ON "public"."Finished Compost" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update issues" ON "public"."Issues" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update litter" ON "public"."Litter" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update measurements" ON "public"."Measurements" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard update moving day" ON "public"."Moving Day" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard view adding" ON "public"."Adding Material" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard view browns bin" ON "public"."Browns Bin" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard view compost" ON "public"."Finished Compost" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard view issues" ON "public"."Issues" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dashboard view litter" ON "public"."Litter" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer, "site_id_input" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer, "site_id_input" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dnrec_report"("year_input" integer, "site_id_input" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."Adding Material" TO "anon";
GRANT ALL ON TABLE "public"."Adding Material" TO "authenticated";
GRANT ALL ON TABLE "public"."Adding Material" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Bin 1 (Lasagna Layer)_bin1_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Bin 1 (Lasagna Layer)_bin1_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Bin 1 (Lasagna Layer)_bin1_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Browns Bin" TO "anon";
GRANT ALL ON TABLE "public"."Browns Bin" TO "authenticated";
GRANT ALL ON TABLE "public"."Browns Bin" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Browns Bin_browns_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Browns Bin_browns_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Browns Bin_browns_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Finished Compost" TO "anon";
GRANT ALL ON TABLE "public"."Finished Compost" TO "authenticated";
GRANT ALL ON TABLE "public"."Finished Compost" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Finished Compost_compost_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Finished Compost_compost_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Finished Compost_compost_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Form Submission" TO "anon";
GRANT ALL ON TABLE "public"."Form Submission" TO "authenticated";
GRANT ALL ON TABLE "public"."Form Submission" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Form Submission_submission_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Form Submission_submission_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Form Submission_submission_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Issues" TO "anon";
GRANT ALL ON TABLE "public"."Issues" TO "authenticated";
GRANT ALL ON TABLE "public"."Issues" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Issues_issue_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Issues_issue_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Issues_issue_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Litter" TO "anon";
GRANT ALL ON TABLE "public"."Litter" TO "authenticated";
GRANT ALL ON TABLE "public"."Litter" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Litter_litter_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Litter_litter_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Litter_litter_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Measurements" TO "anon";
GRANT ALL ON TABLE "public"."Measurements" TO "authenticated";
GRANT ALL ON TABLE "public"."Measurements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Measurements_measurement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Measurements_measurement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Measurements_measurement_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Moving Day" TO "anon";
GRANT ALL ON TABLE "public"."Moving Day" TO "authenticated";
GRANT ALL ON TABLE "public"."Moving Day" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Moving Day_moving_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Moving Day_moving_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Moving Day_moving_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Site" TO "anon";
GRANT ALL ON TABLE "public"."Site" TO "authenticated";
GRANT ALL ON TABLE "public"."Site" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Site_site_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Site_site_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Site_site_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."alert_email_recipients" TO "anon";
GRANT ALL ON TABLE "public"."alert_email_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_email_recipients" TO "service_role";



GRANT ALL ON SEQUENCE "public"."alert_email_recipients_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alert_email_recipients_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alert_email_recipients_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
