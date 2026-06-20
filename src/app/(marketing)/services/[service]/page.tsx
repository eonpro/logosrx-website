import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services, getService } from "@/data/services";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  faqPageSchema,
  ENTITY_IDS,
  absoluteUrl,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import ServicePage from "@/components/ServicePage";

interface PageProps {
  params: Promise<{ service: string }>;
}

export function generateStaticParams() {
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service } = await params;
  const svc = getService(service);
  if (!svc) return {};
  return buildMetadata({
    title: svc.metaTitle,
    description: svc.metaDescription,
    path: `/services/${svc.slug}`,
  });
}

export default async function ServiceRoute({ params }: PageProps) {
  const { service } = await params;
  const svc = getService(service);
  if (!svc) notFound();

  const path = `/services/${svc.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: svc.name, path },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: svc.headline,
      description: svc.metaDescription,
      path,
    }),
    {
      "@type": "Service",
      serviceType: svc.name,
      name: svc.name,
      description: svc.answerFirst,
      provider: { "@id": ENTITY_IDS.pharmacy },
      url: absoluteUrl(path),
      areaServed: { "@type": "Country", name: "United States" },
    },
    faqPageSchema(svc.faqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />
      <ServicePage service={svc} />
    </>
  );
}
