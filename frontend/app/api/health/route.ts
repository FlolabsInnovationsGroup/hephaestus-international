import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  let dbOk = false;
  let dbError: string | null = null;
  if (sql) {
    try {
      await sql`SELECT 1`;
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  } else {
    dbError = 'no DATABASE_URL configured';
  }

  return NextResponse.json(
    {
      ok: dbOk,
      app: 'hephaestus-international',
      commitSha: process.env.BUILD_COMMIT_SHA ?? null,
      commitRef: process.env.BUILD_COMMIT_REF ?? null,
      imageTag: process.env.BUILD_IMAGE_TAG ?? null,
      imageDigest: process.env.BUILD_IMAGE_DIGEST ?? null,
      buildTimestamp: process.env.BUILD_TIMESTAMP ?? null,
      now: new Date().toISOString(),
      db: dbOk ? 'ok' : dbError,
    },
    { status: dbOk ? 200 : 503 },
  );
}
