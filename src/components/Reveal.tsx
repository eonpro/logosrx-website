"use client";

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Lightweight CSS-driven fade-in / slide-in animation. Replaces Framer
 * Motion's `whileInView` for simple reveal patterns.
 *
 * Why not Framer?
 *   - Each `motion.div` ships a JS animator that ticks every frame; for a
 *     fade-in we just need a single CSS transition driven by an attribute
 *     flip when the element first enters the viewport.
 *   - CSS transitions are GPU-composited and never block the main thread.
 *   - This component is ~1 KB; replacing N `motion.div` calls keeps the
 *     Framer bundle out of pages that don't need orchestrated animations.
 *
 * Reduced motion is honoured by `globals.css` (which forces transition
 * durations to 0.01 ms when the user opts in), so we don't need to branch
 * on `prefers-reduced-motion` here.
 */
export interface RevealProps {
  /** Element tag to render (default `div`). */
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Delay before the animation starts, in ms. Defaults to 0. */
  delay?: number;
  /** Duration of the transition, in ms. Defaults to 500. */
  duration?: number;
  /** Vertical offset (px) the element animates from. Defaults to 20. */
  offsetY?: number;
  /**
   * Intersection threshold: how much of the element must be visible before
   * we trigger. Defaults to 0.15 (15 %).
   */
  threshold?: number;
  /**
   * Margin that grows / shrinks the root viewport. Use negative values to
   * trigger earlier — e.g. `"-100px"` fires when the top of the element is
   * still 100 px below the viewport edge.
   */
  rootMargin?: string;
  /**
   * When true, the element animates once and stays visible. Defaults to true.
   */
  once?: boolean;
  style?: CSSProperties;
}

export default function Reveal({
  as: Tag = "div",
  children,
  className,
  delay = 0,
  duration = 500,
  offsetY = 20,
  threshold = 0.15,
  rootMargin = "-50px 0px",
  once = true,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No-IO fallback: assume visible so users without IntersectionObserver
    // still see content (e.g. older Safari behind aggressive content blockers).
    // Deferred via microtask to keep `setState` out of the effect body.
    if (!("IntersectionObserver" in window)) {
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  const mergedStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : `translateY(${offsetY}px)`,
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
    willChange: visible ? undefined : "opacity, transform",
    ...style,
  };

  return (
    <Tag ref={ref} className={className} style={mergedStyle}>
      {children}
    </Tag>
  );
}
