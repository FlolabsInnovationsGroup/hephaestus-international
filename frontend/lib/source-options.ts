const FALLBACK_SOURCE_OPTIONS = ['LinkedIn', 'AI Referrals', 'University', 'Referral', 'Search engine', 'Social media', 'Website', 'Forms', 'Email', 'WhatsApp', 'Other'];

function parseTitle(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'plain_text' in part && typeof (part as { plain_text?: unknown }).plain_text === 'string') {
          return (part as { plain_text: string }).plain_text;
        }
        return '';
      })
      .join('')
      .trim();
  }
  return '';
}

function parseRichText(value: unknown) {
  if (!Array.isArray(value)) return '';
  return value
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part === 'object' && 'plain_text' in part && typeof (part as { plain_text?: unknown }).plain_text === 'string') {
        return (part as { plain_text: string }).plain_text;
      }
      return '';
    })
    .join('')
    .trim();
}

function extractSourceName(properties: Record<string, any>) {
  const candidates = Object.values(properties ?? {});

  for (const property of candidates) {
    if (!property || typeof property !== 'object') continue;
    const type = typeof property.type === 'string' ? property.type : '';

    if (type === 'title') {
      const value = parseTitle(property.title);
      if (value) return value;
    }

    if (type === 'rich_text') {
      const value = parseRichText(property.rich_text);
      if (value) return value;
    }

    if (type === 'select' && property.select?.name) {
      return String(property.select.name).trim();
    }

    if (type === 'formula') {
      const formula = property.formula;
      if (typeof formula?.string === 'string' && formula.string.trim()) return formula.string.trim();
    }
  }

  return '';
}

export async function getApplicationSourceOptions(): Promise<string[]> {
  const databaseId = process.env.NOTION_SOURCES_DATABASE_ID || process.env.NOTION_SOURCE_DATABASE_ID || process.env.NOTION_APPLICANT_SOURCES_DATABASE_ID || '';
  const token = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || process.env.NOTION_SECRET || '';

  if (!databaseId || !token) {
    return FALLBACK_SOURCE_OPTIONS;
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ page_size: 100 }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to load Notion sources database', await response.text());
      return FALLBACK_SOURCE_OPTIONS;
    }

    const payload = await response.json();
    const options = Array.from(
      new Set(
        (payload.results ?? [])
          .map((page: any) => extractSourceName(page.properties ?? {}))
          .filter((value: string) => Boolean(value)),
      ),
    ) as string[];

    options.sort((a, b) => a.localeCompare(b));

    return options.length > 0 ? options : FALLBACK_SOURCE_OPTIONS;
  } catch (error) {
    console.error('Unable to fetch Notion source options', error);
    return FALLBACK_SOURCE_OPTIONS;
  }
}

export { FALLBACK_SOURCE_OPTIONS };
