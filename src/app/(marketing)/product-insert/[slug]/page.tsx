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
      <div className="bg-gradient-to-b from-cream to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/50 hover:text-magenta transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Support Center
          </Link>

          <span className="inline-block rounded-full bg-magenta/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-magenta mb-4">
            Product Insert
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight mb-4">
            {insert.title}
          </h1>
          <p className="text-lg text-navy/60 leading-relaxed mb-8">
            {insert.subtitle}
          </p>

          <ProductInsertContent />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-12">
          {insert.sections.map((section, i) => (
            <section key={i}>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-magenta/10 text-magenta text-sm font-bold">
                  {i + 1}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-navy">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4 pl-11">
                {section.content.map((paragraph, j) => (
                  <p key={j} className="text-base leading-relaxed text-navy/70">
                    {paragraph}
                  </p>
                ))}
                {section.image && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-beige bg-cream/30 p-4">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={800}
                      height={450}
                      className="w-full h-auto rounded-xl"
                    />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-16 rounded-2xl bg-cream/60 border border-beige p-6 sm:p-8">
          <p className="text-xs text-navy/40 leading-relaxed">
            <strong className="text-navy/60">Disclaimer:</strong> This product insert is
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
        <div className="mt-8 rounded-2xl bg-navy-deep p-8 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Questions about your medication?
          </h3>
          <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
            Our pharmacists are available to help with injection technique, dosage questions,
            and medication storage.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={CONTACT.emailHref}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
            >
              Contact Our Team
            </a>
            <a
              href={SITE.onboarding}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-magenta hover:text-magenta-light transition-colors"
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
