import postgres from 'postgres';

const databaseUrl =
  process.env.CHRONOS_DB_DATABASE_URL ||
  process.env.CHRONOS_DB_POSTGRES_URL ||
  process.env.CHRONOS_DB ||
  process.env.DATABASE_URL ||
  process.env.FL_CHRONOS_DATABASE_URL ||
  '';

if (!databaseUrl) {
  console.warn('CHRONOS_DB_DATABASE_URL / CHRONOS_DB_POSTGRES_URL / CHRONOS_DB / DATABASE_URL / FL_CHONOS_DATABASE_URL not set for applicant production storage.');
}

const statementTimeoutMs = Number(process.env.PG_STATEMENT_TIMEOUT_MS ?? '120000');

function buildConnectionOptions(rawUrl: string): { url: string; ssl?: { rejectUnauthorized: boolean } } {
  if (!/sslmode=require/i.test(rawUrl)) {
    return { url: rawUrl };
  }
  // Strip sslmode=require from the URL and pass ssl option explicitly so
  // postgres.js connects with SSL without rejecting the RDS self-signed cert.
  let normalizedUrl = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('sslmode');
    normalizedUrl = parsed.toString();
  } catch {
    normalizedUrl = rawUrl.replace(/([?&])sslmode=require(&?)/i, (_m, pre: string, suf: string) => {
      if (pre === '?' && suf) return '?';
      if (pre === '&' && suf) return '&';
      return '';
    }).replace(/[?&]$/, '');
  }
  return { url: normalizedUrl, ssl: { rejectUnauthorized: false } };
}

const { url: pgUrl, ssl: pgSsl } = buildConnectionOptions(databaseUrl);

export const sql = databaseUrl
  ? postgres(pgUrl, {
      max: 5,
      idle_timeout: 300,
      connect_timeout: 30,
      prepare: false,
      ...(pgSsl ? { ssl: pgSsl } : {}),
      // Large shared flolabs_users table (HubSpot + Chronos); 8s was aborting list loads.
      connection: { statement_timeout: statementTimeoutMs },
    })
  : null;
