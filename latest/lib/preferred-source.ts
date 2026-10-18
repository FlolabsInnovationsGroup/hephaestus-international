import { preferredSource } from "@/content/site-content";

const LIVE_HOSTS = new Set([
  preferredSource.domain,
  `www.${preferredSource.domain}`,
]);

type PreferredSourceClient = {
  init: (options?: { theme?: "light" | "dark"; lang?: string }) => void;
  addPreferredSource: () => void;
};

type PreferredSourceQueue = {
  push: (...callbacks: Array<(client: PreferredSourceClient) => void>) => void;
  api?: PreferredSourceClient;
};

declare global {
  interface Window {
    PREFERRED_SOURCE?: PreferredSourceQueue | Array<(client: PreferredSourceClient) => void>;
  }
}

function readClient(): PreferredSourceClient | null {
  const queue = window.PREFERRED_SOURCE;
  if (!queue || Array.isArray(queue)) return null;
  return queue.api ?? null;
}

/**
 * On the live domain, open Google's in-page confirmation.
 * Returns false when the caller should follow the documented deeplink instead.
 * Must run inside the click handler so a fallback tab is not blocked.
 */
export function openPreferredSourceInline(): boolean {
  if (!LIVE_HOSTS.has(window.location.hostname)) return false;
  const client = readClient();
  if (!client) return false;
  client.addPreferredSource();
  return true;
}
