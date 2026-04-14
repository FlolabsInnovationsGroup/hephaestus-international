import { NextResponse } from 'next/server';
import { addStageResource, getSessionUser, getStageResourcesForHr, removeStageResource, saveStageResource } from '@/lib/application-store';

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage') ?? undefined;
  const resources = await getStageResourcesForHr(stage);
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  if (!body?.stage || !body?.title || !body?.url) {
    return NextResponse.json({ error: 'Missing stage, title, or url' }, { status: 400 });
  }
  const resource = await addStageResource({
    stage: String(body.stage),
    title: String(body.title),
    url: String(body.url),
    applicantPrompt: String(body.applicantPrompt ?? ''),
  });
  return NextResponse.json({ ok: true, resource });
}

export async function PATCH(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  const id = String(body?.id ?? '').trim();
  const title = String(body?.title ?? '').trim();
  const url = String(body?.url ?? '').trim();
  const applicantPrompt = String(body?.applicantPrompt ?? '').trim();
  if (!id || !title || !url) {
    return NextResponse.json({ error: 'Missing id, title, or url' }, { status: 400 });
  }
  try {
    const resource = await saveStageResource({ id, title, url, applicantPrompt });
    return NextResponse.json({ ok: true, resource });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer?.hrBinaryRole) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await removeStageResource(id);
  return NextResponse.json({ ok: true });
}
