export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import DnrecPdf from './DnrecPdf';
import { DNREC_2024_FINAL_RESULTS } from '@/lib/constants';
import { calculateQuarterlyReport } from '@/lib/dnrec-calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // server-only
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const siteParam = searchParams.get('site');

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
    // Calculate quarterly data using TypeScript instead of SQL function
    try {
      const year = parseInt(yearParam || '0', 10);
      const siteId = (siteParam && siteParam !== 'total') ? parseInt(siteParam, 10) : null;
      
      if (isNaN(year) || year < 2000 || year > 3000) {
        throw new Error('Invalid year parameter');
      }

      data = await calculateQuarterlyReport(supabase, year, siteId);
      error = null;
    } catch (err) {
      error = err as Error;
      data = null;
      console.error('Error calculating quarterly report:', err);
    }
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

