import {
  extractTeamMemberPageTitle,
  formatNotionUuid32,
  notionPageUrl,
  parentDatabaseIdMatches,
  retrieveTeamMemberPageIfInDatabase,
  teamMemberPageSearchBlob,
  tryParseNotionPageId,
  type NotionProp,
  type TeamMemberSearchHit,
} from '@/lib/notion-team-member-search';
import { teamMemberMatchesSearchText } from '@/lib/team-member-search-match';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type DirectoryEntry = TeamMemberSearchHit & { searchText: string };

type DirectoryCache = {
  builtAt: number;
  dbIdNorm: string;
  entries: DirectoryEntry[];
};

declare global {
  // eslint-disable-next-line no-var
  var __hephaestusTeamMemberDirectory: DirectoryCache | undefined;
}

let __hephaestusFullBuild: Promise<void> | undefined;

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

async function buildDirectory(token: string, databaseIdFormatted: string, dbIdNorm: string, maxPages?: number): Promise<DirectoryEntry[]> {
  const entries: DirectoryEntry[] = [];
  let cursor: string | undefined;
  let pagesFetched = 0;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const data = await notionFetch<{
      results: Record<string, unknown>[];
      has_more?: boolean;
      next_cursor?: string | null;
    }>(`/databases/${databaseIdFormatted}/query`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    for (const item of data.results ?? []) {
      const page = item as {
        id: string;
        parent?: { type?: string; database_id?: string };
        properties?: Record<string, NotionProp>;
        url?: string;
      };
      if (!parentDatabaseIdMatches(page, dbIdNorm)) continue;
      const title = extractTeamMemberPageTitle(page.properties ?? {}) || 'Untitled';
      entries.push({
        id: page.id,
        title,
        url: page.url ?? notionPageUrl(page.id),
        searchText: teamMemberPageSearchBlob(page),
      });
    }

    pagesFetched += 1;
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor ?? undefined;
    if (maxPages && pagesFetched >= maxPages) break;
  } while (cursor);

  return entries;
}

function scheduleFullBuild(token: string, databaseIdFormatted: string, dbIdNorm: string): void {
  if (__hephaestusFullBuild) return;
  __hephaestusFullBuild = buildDirectory(token, databaseIdFormatted, dbIdNorm)
    .then(entries => {
      globalThis.__hephaestusTeamMemberDirectory = { builtAt: Date.now(), dbIdNorm, entries };
    })
    .catch(() => { /* keep stale data on failure */ })
    .finally(() => { __hephaestusFullBuild = undefined; });
}

async function getDirectory(token: string, rawTeamMembersDbId: string): Promise<DirectoryEntry[]> {
  const digits = rawTeamMembersDbId.replace(/-/g, '');
  const dbIdNorm = digits;
  const databaseIdFormatted = formatNotionUuid32(digits);
  const now = Date.now();
  const cached = globalThis.__hephaestusTeamMemberDirectory;

  // Fast path: fresh cache
  if (cached && cached.dbIdNorm === dbIdNorm && now - cached.builtAt < CACHE_TTL_MS) {
    return cached.entries;
  }

  // Stale data available: return immediately, rebuild in background
  if (cached?.dbIdNorm === dbIdNorm && cached.entries.length > 0) {
    scheduleFullBuild(token, databaseIdFormatted, dbIdNorm);
    return cached.entries;
  }

  // Cold start: fetch first page immediately, full build in background
  const firstPage = await buildDirectory(token, databaseIdFormatted, dbIdNorm, 1);
  globalThis.__hephaestusTeamMemberDirectory = { builtAt: Date.now(), dbIdNorm, entries: firstPage };
  scheduleFullBuild(token, databaseIdFormatted, dbIdNorm);
  return firstPage;
}

export async function searchTeamMemberDirectory(
  token: string,
  rawTeamMembersDbId: string,
  qRaw: string,
  limit = 100,
): Promise<TeamMemberSearchHit[]> {
  const digits = rawTeamMembersDbId.replace(/-/g, '');
  if (digits.length !== 32) {
    throw new Error('NOTION_TEAM_MEMBERS_DB_ID must be a 32-character Notion database UUID.');
  }
  const dbIdNorm = digits;
  const qTrim = qRaw.trim();
  const cap = Math.min(Math.max(1, limit), 120);
  const merged = new Map<string, TeamMemberSearchHit>();

  const directory = await getDirectory(token, rawTeamMembersDbId);

  if (!qTrim) {
    return [...directory]
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, cap)
      .map(({ id, title, url }) => ({ id, title, url }));
  }

  const directId = tryParseNotionPageId(qTrim);
  if (directId) {
    const one = await retrieveTeamMemberPageIfInDatabase(token, directId, dbIdNorm);
    if (one) merged.set(one.id, one);
  }

  for (const entry of directory) {
    if (teamMemberMatchesSearchText(entry.searchText, qTrim)) {
      merged.set(entry.id, { id: entry.id, title: entry.title, url: entry.url });
    }
  }

  return [...merged.values()].sort((a, b) => a.title.localeCompare(b.title)).slice(0, cap);
}
