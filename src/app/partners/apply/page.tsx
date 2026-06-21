import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "Become a Partner",
  description:
    "Apply to the Logos RX marketing partner program. Provide marketing and brand-support services for a multi-state licensed compounding pharmacy.",
};

export default function PartnerApplyPage() {
  return <ApplyForm />;
}
