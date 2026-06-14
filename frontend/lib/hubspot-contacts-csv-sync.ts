import type postgres from "postgres";

/** Idempotent — shared RDS may predate Chronos column adds. */
export async function ensureHubspotCsvSyncColumns(sql: postgres.Sql) {
  await sql`alter table flolabs_users add column if not exists company_name text`;
  await sql`alter table flolabs_users add column if not exists hubspot_record_id text`;
  await sql`alter table flolabs_users add column if not exists hubspot_lifecycle_stage text`;
  await sql`alter table flolabs_users add column if not exists hubspot_lead_status text`;
}

export type HubspotCsvRow = Record<string, string>;

function cell(row: HubspotCsvRow, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

export type NormalizedHubspotContact = {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  hubspotRecordId: string | null;
  lifecycleStage: string | null;
  leadStatus: string | null;
  companyName: string | null;
  phone: string | null;
  linkedin: string | null;
  country: string | null;
  city: string | null;
};

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export function normalizeHubspotCsvRow(row: HubspotCsvRow): NormalizedHubspotContact | null {
  const email = cell(row, "Email", "email").toLowerCase();
  if (!emailOk(email)) return null;

  const first = cell(row, "First Name", "First name");
  const last = cell(row, "Last Name", "Last name");
  const combined = [first, last].filter(Boolean).join(" ").trim();
  const fallbackName = cell(row, "First and Last Name", "First and last name");
  const name = (combined || fallbackName || email.split("@")[0] || "Contact").trim();

  return {
    email,
    name,
    firstName: first,
    lastName: last,
    hubspotRecordId: (() => {
      const id = cell(row, "Record ID", "record id");
      return id || null;
    })(),
    lifecycleStage: (() => {
      const v = cell(row, "Lifecycle Stage", "Lifecycle stage");
      return v || null;
    })(),
    leadStatus: (() => {
      const v = cell(row, "Lead Status", "Lead status");
      return v || null;
    })(),
    companyName: (() => {
      const v = cell(row, "Company Name", "Company name");
      return v || null;
    })(),
    phone: (() => {
      const v = cell(row, "Phone Number", "Mobile Phone Number", "WhatsApp Phone Number");
      return v || null;
    })(),
    linkedin: (() => {
      const v = cell(row, "LinkedIn URL", "Linkedin URL", "Linkedin account");
      return v || null;
    })(),
    country: (() => {
      const v = cell(row, "Country/Region", "Country", "IP Country");
      return v || null;
    })(),
    city: (() => {
      const v = cell(row, "City", "IP City", "Candidate Location");
      return v || null;
    })(),
  };
}

export async function upsertFlolabsUserFromHubspotContact(
  sql: postgres.Sql,
  p: NormalizedHubspotContact,
  passwordPlaceholder: string,
) {
  await sql`
    insert into flolabs_users (
      email,
      name,
      password,
      role,
      first_name,
      last_name,
      hubspot_record_id,
      hubspot_lifecycle_stage,
      hubspot_lead_status,
      company_name,
      phone_number,
      linkedin_url,
      country,
      city,
      stage,
      status,
      source,
      updated_at
    ) values (
      ${p.email},
      ${p.name},
      ${passwordPlaceholder},
      'applicant',
      ${p.firstName ?? ""},
      ${p.lastName ?? ""},
      ${p.hubspotRecordId},
      ${p.lifecycleStage},
      ${p.leadStatus},
      ${p.companyName},
      ${p.phone},
      ${p.linkedin},
      ${p.country},
      ${p.city},
      'application_submitted',
      'applying',
      'hubspot_csv',
      now()
    )
    on conflict (email) do update set
      name = case
        when length(trim(excluded.name)) > length(trim(coalesce(flolabs_users.name, ''))) then excluded.name
        else flolabs_users.name
      end,
      first_name = case
        when length(trim(coalesce(excluded.first_name, ''))) > length(trim(coalesce(flolabs_users.first_name, '')))
          then excluded.first_name
        else flolabs_users.first_name
      end,
      last_name = case
        when length(trim(coalesce(excluded.last_name, ''))) > length(trim(coalesce(flolabs_users.last_name, '')))
          then excluded.last_name
        else flolabs_users.last_name
      end,
      hubspot_record_id = coalesce(excluded.hubspot_record_id, flolabs_users.hubspot_record_id),
      hubspot_lifecycle_stage = coalesce(excluded.hubspot_lifecycle_stage, flolabs_users.hubspot_lifecycle_stage),
      hubspot_lead_status = coalesce(excluded.hubspot_lead_status, flolabs_users.hubspot_lead_status),
      company_name = coalesce(excluded.company_name, flolabs_users.company_name),
      phone_number = coalesce(excluded.phone_number, flolabs_users.phone_number),
      linkedin_url = coalesce(excluded.linkedin_url, flolabs_users.linkedin_url),
      country = coalesce(excluded.country, flolabs_users.country),
      city = coalesce(excluded.city, flolabs_users.city),
      source = case
        when flolabs_users.source is null or trim(flolabs_users.source) = '' then excluded.source
        else flolabs_users.source
      end,
      updated_at = now()
  `;
}
