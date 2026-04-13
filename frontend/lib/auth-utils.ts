import { randomBytes } from 'crypto';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createPasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function buildResetUrl(token: string, requestUrl?: string): string {
  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    (requestUrl ? new URL(requestUrl).origin : 'http://localhost:3000');

  return `${baseUrl.replace(/\/$/, '')}/login?reset=${encodeURIComponent(token)}`;
}
