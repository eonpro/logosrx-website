import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPillar, REVIEWER } from "@/data/knowledge";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  articleSchema,
  faqPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import PillarArticle from "@/components/PillarArticle";

const pillar = getPillar("");

export const metadata: Metadata = pillar
  ? buildMetadata({
      title: pillar.metaTitle,
      description: pillar.metaDescription,
      path: "/compounding-pharmacy",
    })
  : {};

export default function CompoundingPharmacyHub() {
  if (!pillar) notFound();

  const path = "/compounding-pharmacy";
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "What is a compounding pharmacy?", path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: pillar.title,
      description: pillar.metaDescription,
      path,
      lastReviewed: pillar.lastReviewed,
      reviewer: REVIEWER ?? undefined,
    }),
    articleSchema({
      headline: pillar.title,
      description: pillar.metaDescription,
      path,
      datePublished: pillar.lastReviewed,
      section: "Compounding 101",
    }),
    faqPageSchema(pillar.faqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <PillarArticle pillar={pillar} />
    </>
  );
}
