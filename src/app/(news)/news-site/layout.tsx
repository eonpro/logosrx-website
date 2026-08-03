import type { Metadata } from "next";
import NewsFooter from "@/components/news/NewsFooter";
import { NEWS_SITE, NEWS_SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(NEWS_SITE_URL),
  title: {
    default: NEWS_SITE.name,
    template: `%s | ${NEWS_SITE.name}`,
  },
  description: NEWS_SITE.description,
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-navy antialiased">
      {children}
      <NewsFooter />
    </div>
  );
}
