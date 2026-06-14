/**
 * Team Members database search for HR linking (Hephaestus).
 * Combines workspace search, optional direct page-id resolve, and DB scan so rows
 * match on any property — not only titles Notion's indexer promoted.
 */

const NOTION_API = 'https://api.notion.com/v1';
export const NOTION_VERSION = '2022-06-28';

export type TeamMemberSearchHit = { id: string; title: string; url: string };

type NotionFrag = { plain_text?: string; text?: { content?: string } };
export type NotionProp = {
  type?: string;
  title?: NotionFrag[];
  rich_text?: NotionFrag[];
  email?: string | null;
  url?: string | null;
  phone_number?: string | null;
  number?: number | null;
  select?: { name?: string | null };
  multi_select?: { name?: string }[];
  status?: { name?: string | null };
  relation?: { id: string }[];
  formula?: { type?: string; string?: string; number?: number | null; boolean?: boolean | null };
};

function richPlain(fragments: NotionFrag[] | undefined): string {
  if (!fragments?.length) return '';
  return fragments
    .map((t) => t.plain_text ?? t.text?.content ?? '')
    .join('')
    .trim();
}

export function extractTeamMemberPageTitle(properties: Record<string, NotionProp>): string {
  for (const prop of Object.values(properties)) {
    if (prop?.type === 'title') {
      const t = richPlain(prop.title);
      if (t) return t;
    }
  }
  return '';
}

function collectPropertySearchPieces(prop: NotionProp | undefined): string[] {
  if (!prop?.type) return [];
  const out: string[] = [];
  switch (prop.type) {
    case 'title':
      out.push(richPlain(prop.title));
      break;
    case 'rich_text':
      out.push(richPlain(prop.rich_text));
      break;
    case 'email':
      out.push(prop.email ?? '');
      break;
    case 'phone_number':
      out.push(String(prop.phone_number ?? ''));
      break;
    case 'url':
      out.push(String(prop.url ?? ''));
      break;
    case 'number':
      if (prop.number != null && Number.isFinite(prop.number)) out.push(String(prop.number));
      break;
    case 'select':
      out.push(prop.select?.name ?? '');
      break;
    case 'multi_select':
      for (const m of prop.multi_select ?? []) out.push(m?.name ?? '');
      break;
    case 'status':
      out.push(prop.status?.name ?? '');
      break;
    case 'relation':
      for (const r of prop.relation ?? []) {
        out.push(r.id, r.id.replace(/-/g, ''));
      }
      break;
    case 'formula': {
      const f = prop.formula;
      if (!f) break;
      if (f.type === 'string') out.push(f.string ?? '');
      else if (f.type === 'number' && f.number != null && Number.isFinite(f.number)) out.push(String(f.number));
      else if (f.type === 'boolean' && f.boolean != null) out.push(String(f.boolean));
      break;
    }
    case 'rollup': {
      const roll = (prop as { rollup?: { type?: string; array?: unknown[]; string?: string | null; number?: number | null } })
        .rollup;
      if (!roll) break;
      if (roll.type === 'array' && Array.isArray(roll.array)) {
        for (const item of roll.array) {
          if (item && typeof item === 'object') {
            const o = item as { plain_text?: string };
            if (o.plain_text) out.push(o.plain_text);
          }
        }
      } else if (roll.type === 'string') out.push(roll.string ?? '');
      else if (roll.type === 'number' && roll.number != null && Number.isFinite(roll.number)) {
        out.push(String(roll.number));
      }
      break;
    }
    default:
      break;
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

export function teamMemberPageSearchBlob(page: { id?: string; properties?: Record<string, NotionProp> }): string {
  const chunks: string[] = [];
  const id = page.id ?? '';
  if (id) {
    chunks.push(id, id.replace(/-/g, ''));
  }
  for (const prop of Object.values(page.properties ?? {})) {
    chunks.push(...collectPropertySearchPieces(prop));
  }
  return chunks.join('\n').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function formatNotionUuid32(raw32: string): string {
  const s = raw32.replace(/-/g, '');
  if (s.length !== 32) return raw32;
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function tryParseNotionPageId(input: string): string | null {
  const hex = input.trim().replace(/[^a-fA-F0-9]/g, '');
  if (hex.length !== 32) return null;
  return formatNotionUuid32(hex);
}

export function notionPageUrl(id: string): string {
  return `https://www.notion.so/${id.replace(/-/g, '')}`;
}

export function parentDatabaseIdMatches(page: { parent?: { type?: string; database_id?: string } }, expectedNorm: string): boolean {
  const p = page.parent;
  if (!p || p.type !== 'database_id' || !p.database_id) return false;
  return p.database_id.replace(/-/g, '') === expectedNorm;
}

async function notionFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${res.status}: ${text.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

export async function retrieveTeamMemberPageIfInDatabase(
  token: string,
  pageId: string,
  teamMembersDbIdNorm: string,
): Promise<TeamMemberSearchHit | null> {
  try {
    const page = (await notionFetch(`/pages/${pageId}`, token)) as {
      id: string;
      archived?: boolean;
      parent?: { type?: string; database_id?: string };
      properties?: Record<string, NotionProp>;
      url?: string;
    };
    if (page.archived) return null;
    if (!parentDatabaseIdMatches(page, teamMembersDbIdNorm)) return null;
    const title = extractTeamMemberPageTitle(page.properties ?? {}) || 'Untitled';
    return { id: page.id, title, url: page.url ?? notionPageUrl(page.id) };
  } catch {
    return null;
  }
}

export async function searchNotionWorkspaceForTeamDb(
  token: string,
  query: string,
  teamMembersDbIdNorm: string,
  pageSize: number,
): Promise<TeamMemberSearchHit[]> {
  const res = await fetch(`${NOTION_API}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    },
    body: JSON.stringify({
      query,
      filter: { property: 'object', value: 'page' },
      page_size: pageSize,
    }),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Record<string, unknown>[] };
  const out: TeamMemberSearchHit[] = [];
  for (const item of data.results ?? []) {
    const page = item as {
      id: string;
      parent?: { database_id?: string };
      properties?: Record<string, NotionProp>;
      url?: string;
    };
    const parentDb = String(page.parent?.database_id ?? '').replace(/-/g, '');
    if (parentDb !== teamMembersDbIdNorm) continue;
    const title = extractTeamMemberPageTitle(page.properties ?? {}) || 'Untitled';
    out.push({ id: page.id, title, url: page.url ?? notionPageUrl(page.id) });
  }
  return out;
}

/**
 * Scan Team Members database pages (bounded) and substring-match on full property text.
 * Catches rows Notion workspace search under-ranks or omits (e.g. empty title, dense properties).
 */
export async function queryTeamMembersDatabaseForSubstring(
  token: string,
  databaseIdFormatted: string,
  teamMembersDbIdNorm: string,
  qLower: string,
  maxBatches: number,
): Promise<TeamMemberSearchHit[]> {
  const hits: TeamMemberSearchHit[] = [];
  let cursor: string | undefined;
  for (let batch = 0; batch < maxBatches; batch += 1) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch<{ results: Record<string, unknown>[]; has_more?: boolean; next_cursor?: string | null }>(
      `/databases/${databaseIdFormatted}/query`,
      token,
      { method: 'POST', body: JSON.stringify(body) },
    );

    for (const item of data.results ?? []) {
      const page = item as {
        id: string;
        parent?: { database_id?: string };
        properties?: Record<string, NotionProp>;
        url?: string;
      };
      if (!parentDatabaseIdMatches(page, teamMembersDbIdNorm)) continue;
      const blob = teamMemberPageSearchBlob(page);
      if (!qLower || blob.includes(qLower)) {
        const title = extractTeamMemberPageTitle(page.properties ?? {}) || 'Untitled';
        hits.push({ id: page.id, title, url: page.url ?? notionPageUrl(page.id) });
      }
    }

    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor ?? undefined;
  }
  return hits;
}

/** Fast path: cached in-memory directory + Unicode-safe matching (see team-member-directory-cache). */
export async function searchTeamMemberHits(
  token: string,
  rawTeamMembersDbId: string,
  qRaw: string,
): Promise<TeamMemberSearchHit[]> {
  const { searchTeamMemberDirectory } = await import('@/lib/team-member-directory-cache');
  return searchTeamMemberDirectory(token, rawTeamMembersDbId, qRaw, 100);
}

function notionTokenFromEnv(): string {
  return (
    process.env.NOTION_API_KEY ||
    process.env.NOTION_TOKEN ||
    process.env.NOTION_SECRET ||
    process.env.NOTION_INTEGRATION_TOKEN ||
    ''
  ).trim();
}

/** Archives a Team Members database row (Notion "delete"). */
export async function archiveNotionTeamMemberPage(pageId: string): Promise<void> {
  const token = notionTokenFromEnv();
  if (!token) throw new Error('Notion API key is not configured.');
  const id = tryParseNotionPageId(pageId);
  if (!id) throw new Error('Invalid Notion Team Member page id.');
  await notionFetch(`/pages/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
}
