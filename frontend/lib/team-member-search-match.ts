/** Unicode-safe Team Member search matching (any script / punctuation in names). */

export function normalizeTeamMemberSearchQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function teamMemberMatchesSearchText(searchText: string, rawQ: string): boolean {
  const q = normalizeTeamMemberSearchQuery(rawQ);
  if (!q) return true;

  const blob = searchText;

  if (blob.includes(q)) return true;

  const tokens = q.split(/[\s\p{Z}\p{P}]+/u).filter((t) => t.length > 0);
  if (tokens.length > 1 && tokens.every((t) => blob.includes(t))) return true;
  if (tokens.some((t) => t.length >= 2 && blob.includes(t))) return true;

  const compactBlob = blob.replace(/[\s\p{Z}\p{P}]+/gu, '');
  const compactQ = q.replace(/[\s\p{Z}\p{P}]+/gu, '');
  if (compactQ.length >= 2 && compactBlob.includes(compactQ)) return true;

  const qId = q.replace(/-/g, '');
  if (qId.length >= 8 && /[a-f0-9]{8,}/i.test(qId)) {
    const blobIds = blob.replace(/-/g, '');
    if (blobIds.includes(qId.toLowerCase())) return true;
  }

  return false;
}
