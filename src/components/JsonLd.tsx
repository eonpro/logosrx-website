import type { JsonLdObject } from "@/lib/seo/schema";

/**
 * Generic JSON-LD renderer. Pass any schema object (typically a `graph(...)`
 * document or a single node) and it emits a `<script type="application/ld+json">`.
 *
 * Server-render this wherever structured data belongs — inside `<head>` (root
 * layout) for sitewide entities, or in a page body for page-specific schema.
 * Google and AI crawlers parse JSON-LD regardless of placement.
 *
 * Usage:
 *   <JsonLd data={graph(organizationSchema(), webSiteSchema())} />
 */
export default function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
