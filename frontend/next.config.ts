import type { NextConfig } from "next";

function pushUniqueHostname(
  patterns: { protocol: "https" | "http"; hostname: string; port?: string }[],
  urlString: string | undefined,
) {
  if (!urlString) return;
  try {
    const u = new URL(urlString);
    const protocol = u.protocol === "http:" ? "http" : "https";
    const entry = {
      protocol,
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
    } as { protocol: "https" | "http"; hostname: string; port?: string };
    if (!patterns.some((p) => p.hostname === entry.hostname && p.protocol === entry.protocol)) {
      patterns.push(entry);
    }
  } catch {
    /* ignore invalid URL */
  }
}

const remotePatterns: {
  protocol: "https" | "http";
  hostname: string;
  port?: string;
}[] = [
  {
    protocol: "https",
    hostname: "strapi-production-7ecb.up.railway.app",
  },
  {
    protocol: "https",
    hostname: "res.cloudinary.com",
  },
  {
    protocol: "http",
    hostname: "localhost",
    port: "1337",
  },
];

pushUniqueHostname(remotePatterns, process.env.NEXT_PUBLIC_STRAPI_URL);
pushUniqueHostname(remotePatterns, process.env.CONTENT_STRAPI_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
