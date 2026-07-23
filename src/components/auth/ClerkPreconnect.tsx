import { clerkFrontendApiOrigin } from "@/lib/security/csp";

/**
 * Warms DNS/TLS to the Clerk Frontend API before clerk-js requests it.
 * Render from auth layouts; Next.js hoists these `<link>` tags into `<head>`.
 */
export default function ClerkPreconnect() {
  const origin = clerkFrontendApiOrigin();
  if (!origin) return null;
  return (
    <>
      <link rel="preconnect" href={origin} crossOrigin="" />
      <link rel="dns-prefetch" href={origin} />
    </>
  );
}
