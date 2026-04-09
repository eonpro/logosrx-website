import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support & Education Center",
  description:
    "Expert pharmaceutical consultations, how-to guides, and dedicated customer service from the Logos RX team.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
