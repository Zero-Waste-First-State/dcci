export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import DnrecPdf from './DnrecPdf';
import { DNREC_2024_FINAL_RESULTS } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // server-only
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const siteParam = searchParams.get('site');
  
  // Build arguments for RPC function - always pass both parameters explicitly
  const args: any = {};
  if (yearParam) {
    args.year_input = parseInt(yearParam, 10);
  }
  // Always pass site_id_input, use null for "total" to avoid function ambiguity
  args.site_id_input = (siteParam && siteParam !== 'total') ? parseInt(siteParam, 10) : null;

  let data;
  let error;

  // Use 2024 constants if year is 2024
  if (yearParam === '2024') {
    // Create mock data structure using 2024 final results
    data = [{
      quarter: 'Total',
      total_composted_green_lbs: DNREC_2024_FINAL_RESULTS.greens.pounds,
      total_green_gallons: DNREC_2024_FINAL_RESULTS.greens.gallons,
      estimated_browns_lbs: DNREC_2024_FINAL_RESULTS.browns.pounds,
      total_browns_gallons: DNREC_2024_FINAL_RESULTS.browns.gallons,
      total_finished_compost_gallons: DNREC_2024_FINAL_RESULTS.finished_compost.gallons,
      ancillary_wastes_qty: DNREC_2024_FINAL_RESULTS.ancillary_wastes,
      litter_instances: DNREC_2024_FINAL_RESULTS.litter_instances
    }];
    error = null;
  } else {
    // Use normal database query for other years
    const result = await supabase.rpc('dnrec_report', args);
    data = result.data;
    error = result.error;
  }

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Get site name for PDF title if filtering by site
  let siteName = null;
  if (siteParam && siteParam !== 'total') {
    const { data: siteData } = await supabase
      .from('Site')
      .select('site_name')
      .eq('site_id', siteParam)
      .single();
    siteName = siteData?.site_name || null;
  }

  const pdf = await renderToBuffer(
    <DnrecPdf 
      rows={data || []} 
      year={yearParam ? Number(yearParam) : 'current'}
      siteName={siteName}
    />
  );

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="dnrec-report-${yearParam ?? 'current'}${siteName ? `-${siteName.replace(/\s+/g, '_')}` : ''}.pdf"`,
    },
  });
}

