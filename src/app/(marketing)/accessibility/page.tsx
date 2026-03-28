import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement",
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 py-20 sm:py-28">
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-8">
        Accessibility Statement
      </h1>

      <div className="prose prose-navy max-w-none space-y-6 text-navy/70 text-sm leading-relaxed">
        <p>
          <strong>Last updated:</strong> March 2026
        </p>

        <p>
          Logos RX is committed to ensuring digital accessibility for people with
          disabilities. We continually improve the user experience for everyone and
          apply the relevant accessibility standards.
        </p>

        <h2 className="text-lg font-semibold text-navy">Our Commitment</h2>
        <p>
          We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1
          Level AA. These guidelines explain how to make web content more accessible
          for people with a wide array of disabilities.
        </p>

        <h2 className="text-lg font-semibold text-navy">Measures Taken</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Semantic HTML structure for screen reader compatibility</li>
          <li>Keyboard navigation support throughout the site</li>
          <li>Sufficient color contrast ratios for text and interactive elements</li>
          <li>Alternative text for all meaningful images</li>
          <li>Skip navigation link for keyboard users</li>
          <li>Responsive design that works across devices and zoom levels</li>
        </ul>

        <h2 className="text-lg font-semibold text-navy">Feedback</h2>
        <p>
          If you encounter any accessibility barriers on our site, please contact us at{" "}
          <a href="mailto:support@logosrx.com" className="text-magenta hover:underline">
            support@logosrx.com
          </a>{" "}
          or call{" "}
          <a href="tel:+18555646779" className="text-magenta hover:underline">
            855-564-6779
          </a>.
          We take your feedback seriously and will work to address any issues promptly.
        </p>
      </div>
    </div>
  );
}
