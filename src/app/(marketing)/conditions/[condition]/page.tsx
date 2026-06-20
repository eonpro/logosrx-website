import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { conditions, getCondition } from "@/data/conditions";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  faqPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConditionPage from "@/components/ConditionPage";

interface PageProps {
  params: Promise<{ condition: string }>;
}

export function generateStaticParams() {
  return conditions.map((c) => ({ condition: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { condition } = await params;
  const c = getCondition(condition);
  if (!c) return {};
  return buildMetadata({
    title: c.metaTitle,
    description: c.metaDescription,
    path: `/conditions/${c.slug}`,
  });
}

export default async function ConditionRoute({ params }: PageProps) {
  const { condition } = await params;
  const c = getCondition(condition);
  if (!c) notFound();

  const path = `/conditions/${c.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Conditions", path: "/conditions" },
    { name: c.name, path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: c.headline,
      description: c.metaDescription,
      path,
      about: { name: c.conditionName, alternateName: c.alternateName },
    }),
    faqPageSchema(c.faqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <ConditionPage condition={c} />
    </>
  );
}
