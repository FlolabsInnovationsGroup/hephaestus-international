import type { MetadataRoute } from "next";
import { getAllProjectIds } from "@/lib/projects";
import { getAllInternships } from "@/lib/strapi";
import { siteUrl, withBasePath } from "@/lib/site-url";

export const dynamic = "force-static";

type SitemapRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_ROUTES: SitemapRoute[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/projects", changeFrequency: "weekly", priority: 0.9 },
  { path: "/internships", changeFrequency: "weekly", priority: 0.9 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
];

function absoluteUrl(path: string): string {
  const normalized = path === "" ? "/" : path;
  return `${siteUrl}${withBasePath(normalized)}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const internships = await getAllInternships();
  const projectIds = getAllProjectIds();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency,
      priority,
    }),
  );

  const projectEntries: MetadataRoute.Sitemap = projectIds.map((id) => ({
    url: absoluteUrl(`/projects/${id}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const internshipEntries: MetadataRoute.Sitemap = internships.map((item) => ({
    url: absoluteUrl(`/internships/${item.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...projectEntries, ...internshipEntries];
}
