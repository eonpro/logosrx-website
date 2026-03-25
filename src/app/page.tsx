import Hero from "@/components/Hero";
import BuildingTrust from "@/components/BuildingTrust";
import FeaturedProducts from "@/components/FeaturedProducts";
import DrivenByExcellence from "@/components/DrivenByExcellence";
import Testimonial from "@/components/Testimonial";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import PatientRefill from "@/components/PatientRefill";

export default function Home() {
  return (
    <>
      <Hero />
      <BuildingTrust />
      <FeaturedProducts />
      <DrivenByExcellence />
      <Testimonial />
      <ScrollingMarquee />
      <PatientRefill />
    </>
  );
}
