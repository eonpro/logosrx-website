import Link from "next/link";
import { SITE } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <Link href="/" className="mb-12">
        <img
          src="/images/logo.svg"
          alt={SITE.name}
          className="h-12 w-auto"
        />
      </Link>

      <h1 className="text-7xl sm:text-9xl font-bold text-navy mb-4">404</h1>
      <p className="text-lg text-navy/60 mb-8 max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-3 rounded-full bg-magenta px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-magenta-dark transition-colors"
      >
        Back to Home
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
        </svg>
      </Link>
    </div>
  );
}
