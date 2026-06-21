import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Apply to the Logos RX marketing partner program. Provide bona fide marketing and brand-support services for a licensed compounding pharmacy and earn a fixed, fair-market-value fee under a Marketing Services Agreement.",
};

export default function PartnerApplyPage() {
  return <ApplyForm />;
}
