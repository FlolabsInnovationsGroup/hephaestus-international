/** All distinct values available when merging HR leads (checkbox pool). */
export type MergeFieldState = {
  emails: string[];
  phoneNumbers: string[];
  linkedinUrls: string[];
  cities: string[];
  countries: string[];
  rolesAppliedFor: string[];
  education: string[];
  sources: string[];
  firstNames: string[];
  lastNames: string[];
};

export const EMPTY_MERGE_FIELDS: MergeFieldState = {
  emails: [],
  phoneNumbers: [],
  linkedinUrls: [],
  cities: [],
  countries: [],
  rolesAppliedFor: [],
  education: [],
  sources: [],
  firstNames: [],
  lastNames: [],
};

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
}

type MergeLeadInput = {
  email: string;
  alternateEmails?: string[];
  phoneNumber: string;
  mergedPhoneNumbers?: string[];
  linkedinUrl: string;
  mergedLinkedinUrls?: string[];
  city: string;
  mergedCities?: string[];
  country: string;
  mergedCountries?: string[];
  roleAppliedFor: string;
  education: string;
  source: string;
  firstName: string;
  lastName: string;
};

export function buildMergeOptionsFromLeads(leads: MergeLeadInput[]): MergeFieldState {
  return {
    emails: unique(leads.flatMap((lead) => [lead.email, ...(lead.alternateEmails ?? [])])),
    phoneNumbers: unique(leads.flatMap((lead) => [lead.phoneNumber, ...(lead.mergedPhoneNumbers ?? [])])),
    linkedinUrls: unique(leads.flatMap((lead) => [lead.linkedinUrl, ...(lead.mergedLinkedinUrls ?? [])])),
    cities: unique(leads.flatMap((lead) => [lead.city, ...(lead.mergedCities ?? [])])),
    countries: unique(leads.flatMap((lead) => [lead.country, ...(lead.mergedCountries ?? [])])),
    rolesAppliedFor: unique(leads.map((lead) => lead.roleAppliedFor)),
    education: unique(leads.map((lead) => lead.education)),
    sources: unique(leads.map((lead) => lead.source)),
    firstNames: unique(leads.map((lead) => lead.firstName)),
    lastNames: unique(leads.map((lead) => lead.lastName)),
  };
}

/** Show a merge field group when profiles disagree (multiple distinct values). */
export function mergeFieldsWithConflicts(options: MergeFieldState): Record<keyof MergeFieldState, boolean> {
  return {
    emails: options.emails.length > 1,
    phoneNumbers: options.phoneNumbers.length > 1,
    linkedinUrls: options.linkedinUrls.length > 1,
    cities: options.cities.length > 1,
    countries: options.countries.length > 1,
    rolesAppliedFor: options.rolesAppliedFor.length > 1,
    education: options.education.length > 1,
    sources: options.sources.length > 1,
    firstNames: options.firstNames.length > 1,
    lastNames: options.lastNames.length > 1,
  };
}
