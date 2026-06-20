import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, graph } from "@/lib/seo";

export interface Crumb {
  name: string;
  /** Site-relative path. The final crumb is rendered as plain text. */
  path: string;
}

/**
 * Accessible breadcrumb trail + matching `BreadcrumbList` JSON-LD.
 *
 * Breadcrumbs help users, give Google breadcrumb rich results, and hand AI
 * engines an explicit page-hierarchy signal. Always lead with Home. The last
 * crumb represents the current page and is not linked.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
      <JsonLd data={graph(breadcrumbSchema(items))} />
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-navy/60">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="font-medium text-navy">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.path}
                    className="hover:text-magenta transition-colors"
                  >
                    {item.name}
                  </Link>
                  <span aria-hidden className="text-navy/30">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
