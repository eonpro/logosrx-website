import type { Metadata } from "next";
import CareersContent from "@/components/CareersContent";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the Logos RX team. Explore open positions and help us improve patient outcomes through personalized compounding.",
};

export default function CareersPage() {
  return <CareersContent />;
}
