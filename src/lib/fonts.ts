import { Fraunces } from "next/font/google";

/**
 * Editorial display serif for the portal/onboarding surfaces (hims-style
 * warmth). Exposed as a CSS variable consumed by the `font-display` utility
 * (globals.css). Marketing keeps sofia-pro untouched — this variable is only
 * attached at portal shell roots.
 */
export const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});
