import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { buildMetadata, faqPageSchema, graph } from "@/lib/seo";
import { homeFaqs } from "@/data/faqs";
import Hero from "@/components/Hero";
import StatsCounter from "@/components/StatsCounter";
import HowItWorks from "@/components/HowItWorks";
import BuildingTrust from "@/components/BuildingTrust";
import FeaturedProducts from "@/components/FeaturedProducts";
import DrivenByExcellence from "@/components/DrivenByExcellence";
import Testimonial from "@/components/Testimonial";
import Certifications from "@/components/Certifications";
import FAQ from "@/components/FAQ";
import Newsletter from "@/components/Newsletter";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PatientRefill from "@/components/PatientRefill";

export const metadata: Metadata = buildMetadata({
  description:
    "Logos RX is a 503A compounding pharmacy in Tampa, Florida, licensed across multiple states, with sterile and non-sterile labs preparing personalized medications prescribed by licensed providers.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <JsonLd data={graph(faqPageSchema(homeFaqs.map((f) => ({ question: f.question, answer: f.answer }))))} />
      <Hero />
      <StatsCounter />
      <HowItWorks />
      <BuildingTrust />
      <FeaturedProducts />
      <DrivenByExcellence />
      <Testimonial />
      <Certifications />
      <FAQ />
      <Newsletter />
      <ScrollingMarquee />
      <PatientRefill />
    </>
  );
}
