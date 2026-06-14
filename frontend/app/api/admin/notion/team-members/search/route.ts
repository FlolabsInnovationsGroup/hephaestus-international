import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';
import { searchTeamMemberHits } from '@/lib/notion-team-member-search';

function teamMembersDatabaseId(): string {
  const raw =
    process.env.NOTION_TEAM_MEMBERS_DB_ID ||
    process.env.NEXT_PUBLIC_NOTION_TEAM_MEMBERS_DB_ID ||
    '286a1576955180d6acdec21f7a45dfcc';
  return raw.trim().replace(/^["']|["']$/g, '');
}

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  const token =
    process.env.NOTION_TOKEN ||
    process.env.NOTION_API_KEY ||
    process.env.NOTION_SECRET ||
    process.env.NOTION_INTEGRATION_TOKEN ||
    '';

  if (!token) {
    return NextResponse.json({ error: 'Notion API key not configured on this server.' }, { status: 503 });
  }

  try {
    const results = await searchTeamMemberHits(token, teamMembersDatabaseId(), q);
    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'private, max-age=0, must-revalidate' } },
    );
  } catch (error) {
    console.error('[notion-team-members-search] Error', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
