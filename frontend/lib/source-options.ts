const FALLBACK_SOURCE_OPTIONS = ['LinkedIn', 'AI Referrals', 'University', 'Referral', 'Search engine', 'Social media', 'Website', 'Forms', 'Email', 'WhatsApp', 'Other'];
const SOURCE_PROPERTY_CANDIDATES = ['Name', 'Source', 'Sources', 'Label', 'Title'];

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

function extractPropertyValue(property: any) {
  if (!property || typeof property !== 'object') return '';
  const type = typeof property.type === 'string' ? property.type : '';

  if (type === 'title') {
    return parseTitle(property.title);
  }

  if (type === 'rich_text') {
    return parseRichText(property.rich_text);
  }

  if (type === 'select' && property.select?.name) {
    return String(property.select.name).trim();
  }

  if (type === 'multi_select' && Array.isArray(property.multi_select)) {
    return property.multi_select
      .map((entry: any) => String(entry?.name ?? '').trim())
      .filter(Boolean)
      .join(' || ');
  }

  if (type === 'status' && property.status?.name) {
    return String(property.status.name).trim();
  }

  if (type === 'formula') {
    const formula = property.formula;
    if (typeof formula?.string === 'string' && formula.string.trim()) return formula.string.trim();
  }

  return '';
}

function extractSourceName(properties: Record<string, any>) {
  for (const key of SOURCE_PROPERTY_CANDIDATES) {
    const value = extractPropertyValue(properties?.[key]);
    if (value) return value;
  }

  const candidates = Object.values(properties ?? {});

  for (const property of candidates) {
    if (!property || typeof property !== 'object') continue;
    const value = extractPropertyValue(property);
    if (value) return value;
  }

  return '';
}

export async function getApplicationSourceOptions(): Promise<string[]> {
  const databaseId = process.env.NOTION_SOURCES_DATABASE_ID || process.env.NOTION_SOURCE_DATABASE_ID || process.env.NOTION_APPLICANT_SOURCES_DATABASE_ID || process.env.NEXT_PUBLIC_NOTION_SOURCES_DATABASE_ID || '340a157695518043a641eb72cc21cbb7';
  const token = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY || process.env.NOTION_SECRET || process.env.NOTION_INTEGRATION_TOKEN || '';

  if (!databaseId || !token) {
    console.warn('Falling back to default source options because NOTION source database env is missing.', {
      hasDatabaseId: Boolean(databaseId),
      hasToken: Boolean(token),
    });
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
          .flatMap((page: any) => extractSourceName(page.properties ?? {}).split(' || '))
          .map((value: string) => value.trim())
          .filter((value: string) => Boolean(value)),
      ),
    ) as string[];

    if (options.length === 0) {
      console.warn('Notion sources database returned no usable source names, falling back to defaults.');
    }

    options.sort((a, b) => a.localeCompare(b));

    return options.length > 0 ? options : FALLBACK_SOURCE_OPTIONS;
  } catch (error) {
    console.error('Unable to fetch Notion source options', error);
    return FALLBACK_SOURCE_OPTIONS;
  }
}

export { FALLBACK_SOURCE_OPTIONS };
