import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { productInserts, getProductInsert } from "@/data/product-inserts";
import { CONTACT, SITE } from "@/lib/constants";
import ProductInsertContent from "./ProductInsertContent";

export function generateStaticParams() {
  return productInserts.map((insert) => ({ slug: insert.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const insert = getProductInsert(slug);
  if (!insert) return {};
  return {
    title: insert.title,
    description: insert.subtitle,
  };
}

export default async function ProductInsertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const insert = getProductInsert(slug);
  if (!insert) notFound();

  return (
    <article className="bg-white">
      {/* Header */}
      <div className="bg-white py-16 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/40 hover:text-magenta transition-colors mb-10"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Support Center
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-beige" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta">
              Product Insert
            </span>
            <div className="h-px flex-1 bg-beige" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.1] text-center mb-5">
            {insert.title}
          </h1>
          <p className="text-lg text-navy/50 leading-relaxed text-center max-w-2xl mx-auto mb-8">
            {insert.subtitle}
          </p>

          <div className="flex justify-center">
            <ProductInsertContent />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-16 sm:py-24">
        <div className="space-y-20">
          {insert.sections.map((section, i) => (
            <section key={i}>
              <div className="flex items-start gap-4 mb-6">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-navy text-white text-sm font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-navy leading-tight">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4 pl-14">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-base leading-[1.8] text-navy/60">
                    {paragraph}
                  </p>
                ))}
                {section.image && (
                  <div className="mt-10 -ml-14">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={900}
                      height={500}
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-24 border-t border-beige pt-8">
          <p className="text-xs text-navy/35 leading-relaxed max-w-2xl">
            <strong className="text-navy/50">Disclaimer:</strong> This product insert is
            provided for educational purposes only and does not constitute medical advice.
            Always follow the specific instructions provided by your healthcare provider
            and the medication label. If you have questions about your prescribed therapy,
            contact your provider or Logos RX at{" "}
            <a href={CONTACT.phoneHref} className="text-magenta hover:underline">
              {CONTACT.phone}
            </a>
            .
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-3xl bg-navy-deep p-10 sm:p-14 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Questions about your medication?
          </h3>
          <p className="text-sm text-white/40 mb-8 max-w-md mx-auto">
            Our pharmacists are available to help with injection technique, dosage questions,
            and medication storage.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={CONTACT.emailHref}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
            >
              Contact Our Team
            </a>
            <a
              href={SITE.onboarding}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 px-7 py-3.5 text-sm font-semibold text-white/70 hover:border-magenta hover:text-white transition-colors"
            >
              New Provider
            </a>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          header, footer, nav, [data-header-theme] { display: none !important; }
          article { padding: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </article>
  );
}
