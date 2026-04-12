import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.FL_CHRONOS_DATABASE_URL || '';

if (!databaseUrl) {
  console.warn('DATABASE_URL / FL_CHONOS_DATABASE_URL not set for applicant production storage.');
}

export const sql = databaseUrl ? neon(databaseUrl) : null;
