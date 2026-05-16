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

export const sql = databaseUrl
  ? postgres(databaseUrl, {
      max: 5,
      idle_timeout: 300,
      connect_timeout: 30,
      prepare: false,
      // Large shared flolabs_users table (HubSpot + Chronos); 8s was aborting list loads.
      connection: { statement_timeout: statementTimeoutMs },
    })
  : null;
