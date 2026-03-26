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

export default function Home() {
  return (
    <>
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
