import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/application-store';

const TEAM_MEMBERS_DB_ID = (process.env.NOTION_TEAM_MEMBERS_DB_ID || '286a1576955180d6acdec21f7a45dfcc').replace(/-/g, '');

function extractPageTitle(properties: Record<string, any>): string {
  for (const prop of Object.values(properties)) {
    if (prop?.type === 'title' && Array.isArray(prop.title)) {
      return prop.title.map((t: any) => t?.plain_text ?? '').join('').trim();
    }
  }
  return '';
}

export async function GET(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const token = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || process.env.NOTION_SECRET || process.env.NOTION_INTEGRATION_TOKEN || '';
  if (!token) {
    return NextResponse.json({ error: 'Notion API key not configured on this server.' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        query: q,
        filter: { property: 'object', value: 'page' },
        page_size: 20,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[notion-team-members-search] Notion API error', res.status, text);
      return NextResponse.json({ error: 'Notion API error' }, { status: 502 });
    }

    const data = await res.json();
    const pages: Array<{ id: string; title: string; url: string }> = (data.results ?? [])
      .filter((page: any) => {
        const parentDbId = String(page.parent?.database_id ?? '').replace(/-/g, '');
        return parentDbId === TEAM_MEMBERS_DB_ID;
      })
      .map((page: any) => ({
        id: page.id,
        title: extractPageTitle(page.properties ?? {}),
        url: page.url ?? `https://www.notion.so/${String(page.id).replace(/-/g, '')}`,
      }))
      .filter((page: { id: string; title: string; url: string }) => page.title);

    return NextResponse.json({ results: pages });
  } catch (error) {
    console.error('[notion-team-members-search] Error', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
