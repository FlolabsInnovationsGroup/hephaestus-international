import { NextResponse } from 'next/server';
import { completeApplicantStageReviewBatch, getSessionUser } from '@/lib/application-store';

export async function POST() {
  const viewer = await getSessionUser();
  if (!viewer || viewer.role !== 'applicant') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await completeApplicantStageReviewBatch(viewer.id);

  return NextResponse.json({
    ok: true,
    review: {
      evaluated: result.evaluated,
      outcome: result.outcome,
      newStage: result.newStage,
      newStageTitle: result.newStageTitle,
      applicantMessage: result.applicantMessage,
      incomplete: result.incomplete,
      noReviewablePrompts: result.noReviewablePrompts,
      batchStageCount: result.batchStageCount,
    },
  });
}
