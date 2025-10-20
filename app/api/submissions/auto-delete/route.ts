import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface AutoDeleteOptions {
  dryRun?: boolean;
  olderThanDays?: number;
  batchSize?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const { dryRun = false, olderThanDays, batchSize = 100 }: AutoDeleteOptions = body;
    
    // Build date filter if specified
    let dateFilter = {};
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      dateFilter = { timestamp: { lt: cutoffDate.toISOString() } };
    }

    // Get submissions with date filter
    const { data: submissions, error: submissionsError } = await supabase
      .from('Form Submission')
      .select('submission_id, timestamp')
      .match(dateFilter)
      .order('submission_id', { ascending: true });

    if (submissionsError) throw submissionsError;

    if (!submissions || submissions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        deletedCount: 0, 
        message: 'No submissions found matching criteria' 
      });
    }

    const emptySubmissions: number[] = [];
    const totalSubmissions = submissions.length;

    // Process in batches to avoid memory issues
    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize);
      
      for (const submission of batch) {
        const submissionId = submission.submission_id;
        
        // Check all related tables efficiently
        const [measurementsResult, addingMaterialResult, movingDayResult, 
               finishedCompostResult, brownsBinResult, issuesResult, litterResult] = await Promise.all([
          supabase.from('Measurements').select('measurement_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Adding Material').select('bin_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Moving Day').select('moving_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Finished Compost').select('compost_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Browns Bin').select('browns_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Issues').select('issue_id').eq('submission_id', submissionId).limit(1),
          supabase.from('Litter').select('litter_id').eq('submission_id', submissionId).limit(1)
        ]);

        // Check if any data exists
        const hasData = measurementsResult.data?.length || 
                       addingMaterialResult.data?.length || 
                       movingDayResult.data?.length || 
                       finishedCompostResult.data?.length || 
                       brownsBinResult.data?.length || 
                       issuesResult.data?.length || 
                       litterResult.data?.length;

        if (!hasData) {
          emptySubmissions.push(submissionId);
        }
      }
    }

    // Perform deletion if not a dry run
    let deletedCount = 0;
    if (!dryRun && emptySubmissions.length > 0) {
      // Delete in batches to avoid query size limits
      for (let i = 0; i < emptySubmissions.length; i += batchSize) {
        const batch = emptySubmissions.slice(i, i + batchSize);
        const { error: deleteError } = await supabase
          .from('Form Submission')
          .delete()
          .in('submission_id', batch);

        if (deleteError) throw deleteError;
        deletedCount += batch.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: dryRun ? emptySubmissions.length : deletedCount,
      totalChecked: totalSubmissions,
      deletedIds: dryRun ? [] : emptySubmissions.slice(0, 50), // Limit response size
      message: dryRun 
        ? `Dry run: Found ${emptySubmissions.length} submissions that would be deleted`
        : `Successfully deleted ${deletedCount} empty submissions` 
    });

  } catch (error) {
    console.error('Auto-delete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred' 
    }, { status: 500 });
  }
}
