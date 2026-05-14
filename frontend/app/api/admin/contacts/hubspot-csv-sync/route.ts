import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/application-store";
import { sql } from "@/lib/db";
import {
  ensureHubspotCsvSyncColumns,
  normalizeHubspotCsvRow,
  upsertFlolabsUserFromHubspotContact,
} from "@/lib/hubspot-contacts-csv-sync";

const MAX_BYTES = Number(process.env.HUBSPOT_CSV_SYNC_MAX_BYTES ?? 80 * 1024 * 1024);
const MAX_ROWS = Number(process.env.HUBSPOT_CSV_SYNC_MAX_ROWS ?? 250_000);

export async function POST(request: Request) {
  const viewer = await getSessionUser();
  if (!viewer || !viewer.hrBinaryRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!sql) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data with field file" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES} bytes). Split the export or raise HUBSPOT_CSV_SYNC_MAX_BYTES.` },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const text = buf.toString("utf8");
  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    }) as Record<string, string>[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `CSV parse failed: ${msg}` }, { status: 400 });
  }

  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (${records.length}); max ${MAX_ROWS}. Use Chronos batch script or raise HUBSPOT_CSV_SYNC_MAX_ROWS.` },
      { status: 413 },
    );
  }

  const passwordPlaceholder = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
  await ensureHubspotCsvSyncColumns(sql);

  let processed = 0;
  let skipped = 0;
  for (const row of records) {
    const n = normalizeHubspotCsvRow(row);
    if (!n) {
      skipped += 1;
      continue;
    }
    await upsertFlolabsUserFromHubspotContact(sql, n, passwordPlaceholder);
    processed += 1;
    if (processed % 500 === 0) {
      console.log(`[hubspot-csv-sync] upserted ${processed}…`);
    }
  }

  return NextResponse.json({
    ok: true,
    rowsInFile: records.length,
    upserted: processed,
    skippedNoEmail: skipped,
  });
}
