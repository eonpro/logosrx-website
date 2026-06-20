import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stateLocations, getStateLocation, stateSlug } from "@/data/states";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  faqPageSchema,
  stateServiceSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatePage from "@/components/StatePage";

interface PageProps {
  params: Promise<{ state: string }>;
}

export function generateStaticParams() {
  // Florida has its own richer page at /locations/fl (which also deep-links to
  // the Tampa Bay city pages), so it's excluded from the dynamic [state] set.
  return stateLocations
    .filter((s) => s.code !== "FL")
    .map((s) => ({ state: stateSlug(s.code) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const location = getStateLocation(state);
  if (!location || location.code === "FL") return {};
  return buildMetadata({
    title: location.metaTitle,
    description: location.metaDescription,
    path: `/locations/${stateSlug(location.code)}`,
  });
}

export default async function StateRoute({ params }: PageProps) {
  const { state } = await params;
  const location = getStateLocation(state);
  if (!location || location.code === "FL") notFound();

  const path = `/locations/${stateSlug(location.code)}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: location.name, path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: location.headline,
      description: location.metaDescription,
      path,
    }),
    stateServiceSchema({
      stateName: location.name,
      path,
    }),
    faqPageSchema(location.faqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <StatePage state={location} />
    </>
  );
}
