import { NextResponse } from 'next/server';
import { deleteManagedStep, getSessionUser, updateManagedStep } from '@/lib/application-store';

export async function PATCH(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const stageId = String(body?.stageId ?? '').trim();
  const shortLabel = String(body?.shortLabel ?? '').trim();
  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim();

  if (!stageId || !shortLabel || !title || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await updateManagedStep({ stageId, shortLabel, title, description });
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
