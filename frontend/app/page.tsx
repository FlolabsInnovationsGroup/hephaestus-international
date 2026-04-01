import { Metadata } from "next";
import { Hero } from "@/components/hero";
import { GetRecruited } from "@/components/get-recruited";
import { ProjectsShowcase } from "@/components/projects-showcase";
import { AmbitiousProjects } from "@/components/ambitious-projects";
import { Verticals } from "@/components/verticals";
import { LongLiveLearning } from "@/components/long-live-learning";
import { Benefits } from "@/components/benefits";
import { Methodology } from "@/components/methodology";
import { getServerBrand } from "@/lib/branding";
import {
  getContentStrapiImageUrl,
  getHomepageProjects,
  type Project,
} from "@/lib/strapi";

function withResolvedContentImageUrls(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    images: project.images?.map((img) => ({
      ...img,
      url: getContentStrapiImageUrl(img.url) ?? img.url,
    })),
  }));
}

// Force dynamic rendering to detect domain-based branding
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getServerBrand()
  
  return {
    title: `${brand.name}.International | Innovation in AI & Robotics`,
    description: `Join ${brand.name}.International - Building the future through innovation in AI, robotics, and cutting-edge technology. Explore internship opportunities.`,
    keywords: "AI, robotics, internships, technology, machine learning, engineering",
  }
}

export default async function Home() {
  const projects = withResolvedContentImageUrls(await getHomepageProjects());

  return (
    <>
      <Hero />
      <GetRecruited />
      <ProjectsShowcase projects={projects} />
      <AmbitiousProjects />
      <Verticals />
      <LongLiveLearning />
      <Benefits />
      <Methodology />
    </>
  );
}
