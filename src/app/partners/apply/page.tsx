import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "Become a Partner | Logos RX",
  description:
    "Apply to the Logos RX affiliate partner program. Refer clinics, build your rep network, and earn commission on every transaction.",
};

export default function PartnerApplyPage() {
  return <ApplyForm />;
}
