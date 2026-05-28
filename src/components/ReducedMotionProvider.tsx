"use client";

import { MotionConfig } from "framer-motion";

/**
 * Marketing-tree provider that propagates the user's reduced-motion preference
 * down to every Framer Motion component (`whileInView`, `motion.div`, etc.).
 *
 * `reducedMotion="user"` tells Framer to honor the OS-level setting:
 *   - if reduced motion is requested, transforms are skipped and only opacity
 *     fades remain (and even those are instant).
 *   - otherwise animations play normally.
 *
 * Kept as a `"use client"` boundary because `MotionConfig` itself is a client
 * component, but the wrapped layout above can still be a server component.
 */
export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
