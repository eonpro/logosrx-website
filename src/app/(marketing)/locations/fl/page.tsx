import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateLocation, stateSlug } from "@/data/states";
import { cityLocations } from "@/data/locations";
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

const florida = getStateLocation("fl");

export const metadata: Metadata = florida
  ? buildMetadata({
      title: florida.metaTitle,
      description: florida.metaDescription,
      path: `/locations/${stateSlug(florida.code)}`,
    })
  : {};

export default function FloridaStatePage() {
  if (!florida) notFound();

  const path = `/locations/${stateSlug(florida.code)}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: florida.name, path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: florida.headline,
      description: florida.metaDescription,
      path,
    }),
    stateServiceSchema({ stateName: florida.name, path }),
    faqPageSchema(florida.faqs),
  );

  const flCities = cityLocations.filter((c) => c.state === "FL");

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <StatePage state={florida} cities={flCities} />
    </>
  );
}
