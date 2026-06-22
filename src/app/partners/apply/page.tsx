import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

const APPLY_TITLE = "Become a Logos RX Partner";
const APPLY_DESCRIPTION =
  "Apply to the Logos RX partner program — provide marketing and brand-support services for a multi-state licensed 503A compounding pharmacy.";

export const metadata: Metadata = {
  title: "Become a Partner",
  description: APPLY_DESCRIPTION,
  openGraph: {
    title: APPLY_TITLE,
    description: APPLY_DESCRIPTION,
  },
  twitter: {
    title: APPLY_TITLE,
    description: APPLY_DESCRIPTION,
  },
};

export default function PartnerApplyPage() {
  return <ApplyForm />;
}
