/**
 * Team Members database search for HR linking (Hephaestus).
 * Combines workspace search, optional direct page-id resolve, and DB scan so rows
 * match on any property — not only titles Notion's indexer promoted.
 */

const NOTION_API = 'https://api.notion.com/v1';
export const NOTION_VERSION = '2022-06-28';

export type TeamMemberSearchHit = { id: string; title: string; url: string };

type NotionFrag = { plain_text?: string; text?: { content?: string } };
type NotionProp = {
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

export async function searchTeamMemberHits(
  token: string,
  rawTeamMembersDbId: string,
  qRaw: string,
): Promise<TeamMemberSearchHit[]> {
  const digits = rawTeamMembersDbId.replace(/-/g, '');
  if (digits.length !== 32) {
    throw new Error('NOTION_TEAM_MEMBERS_DB_ID must be a 32-character Notion database UUID.');
  }
  const teamMembersDbIdNorm = digits;
  const databaseIdFormatted = formatNotionUuid32(digits);
  const qTrim = qRaw.trim();
  const qLower = qTrim.toLowerCase().replace(/\s+/g, ' ');

  const merged = new Map<string, TeamMemberSearchHit>();

  if (!qTrim) {
    const browse = await queryTeamMembersDatabaseForSubstring(token, databaseIdFormatted, teamMembersDbIdNorm, '', 2);
    return browse.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 50);
  }

  const directId = tryParseNotionPageId(qTrim);
  if (directId) {
    const one = await retrieveTeamMemberPageIfInDatabase(token, directId, teamMembersDbIdNorm);
    if (one) merged.set(one.id, one);
  }

  const ws = await searchNotionWorkspaceForTeamDb(token, qTrim, teamMembersDbIdNorm, 100);
  for (const h of ws) merged.set(h.id, h);

  const scanned = await queryTeamMembersDatabaseForSubstring(
    token,
    databaseIdFormatted,
    teamMembersDbIdNorm,
    qLower,
    8,
  );
  for (const h of scanned) {
    merged.set(h.id, h);
  }

  return [...merged.values()].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 100);
}
