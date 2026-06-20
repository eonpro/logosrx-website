import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPillar, subPillars, REVIEWER } from "@/data/knowledge";
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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return subPillars().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar || pillar.slug === "") return {};
  return buildMetadata({
    title: pillar.metaTitle,
    description: pillar.metaDescription,
    path: `/compounding-pharmacy/${pillar.slug}`,
    type: "article",
  });
}

export default async function PillarPage({ params }: PageProps) {
  const { slug } = await params;
  const pillar = getPillar(slug);
  if (!pillar || pillar.slug === "") notFound();

  const path = `/compounding-pharmacy/${pillar.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Compounding", path: "/compounding-pharmacy" },
    { name: pillar.title, path },
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
      section: pillar.eyebrow,
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
