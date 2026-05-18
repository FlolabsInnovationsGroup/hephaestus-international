import { NextResponse } from 'next/server';
import { activateManagedStep, deleteManagedStep, getManagedSteps, getSessionUser, updateManagedStep } from '@/lib/application-store';
import type { PassingCondition } from '@/lib/application-db';

export async function GET(_request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const stages = await getManagedSteps({ includeInactive: true });
  return NextResponse.json({ ok: true, stages });
}

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const stageId = String(body?.stageId ?? '').trim();
  if (!stageId) return NextResponse.json({ error: 'Missing stageId' }, { status: 400 });

  try {
    const stage = await activateManagedStep(stageId);
    return NextResponse.json({ ok: true, stage });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Add failed' }, { status: 404 });
  }
}

export async function PATCH(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const stageId = String(body?.stageId ?? '').trim();
  const shortLabel = String(body?.shortLabel ?? '').trim();
  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const applicantAction = String(body?.applicantAction ?? '');
  const passingConditionRaw = String(body?.passingCondition ?? '').trim();
  const passingCondition = (passingConditionRaw === 'none' || passingConditionRaw === 'ai' || passingConditionRaw === 'hr')
    ? passingConditionRaw as PassingCondition
    : undefined;
  const passingConditionAiPrompt = body?.passingConditionAiPrompt !== undefined
    ? String(body.passingConditionAiPrompt)
    : undefined;

  if (!stageId || !shortLabel || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await updateManagedStep({ stageId, shortLabel, title, description, applicantAction, passingCondition, passingConditionAiPrompt });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const stageId = String(searchParams.get('stageId') ?? '').trim();
  if (!stageId) return NextResponse.json({ error: 'Missing stageId' }, { status: 400 });
  try {
    await deleteManagedStep(stageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Delete failed' }, { status: 404 });
  }
}
