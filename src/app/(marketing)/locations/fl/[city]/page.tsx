import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cityLocations, getCityLocation } from "@/data/locations";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  faqPageSchema,
  localServiceSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import LocationPage from "@/components/LocationPage";

interface PageProps {
  params: Promise<{ city: string }>;
}

export function generateStaticParams() {
  return cityLocations.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const location = getCityLocation(city);
  if (!location) return {};
  return buildMetadata({
    title: location.metaTitle,
    description: location.metaDescription,
    path: `/locations/fl/${location.slug}`,
  });
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const location = getCityLocation(city);
  if (!location) notFound();

  const path = `/locations/fl/${location.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: location.stateName, path: "/locations" },
    { name: location.city, path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: location.headline,
      description: location.metaDescription,
      path,
    }),
    localServiceSchema({
      city: location.city,
      stateName: location.stateName,
      path,
    }),
    faqPageSchema(location.faqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <LocationPage location={location} />
    </>
  );
}
