"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 60;
const FRAME_WIDTH = 337;
const FRAME_HEIGHT = 512;
const FPS = 15;

const frameSrc = (i: number) =>
  `/images/vial-frames/frame-${String(i).padStart(2, "0")}.webp`;

/**
 * Rotating vial rendered as a WebP frame sequence on a canvas.
 *
 * Frames have real alpha, so the vial's glass shows whatever is behind the
 * canvas — this renders identically in Chrome, Safari, and Firefox without
 * needing VP9-alpha video support.
 *
 * Frames (~1.7 MB total) only start downloading once the canvas nears the
 * viewport, and playback runs only while visible. With reduced motion the
 * first frame is drawn as a still.
 */
export default function VialLoop({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const images: HTMLImageElement[] = [];
    let loadingStarted = false;
    let playing = false;
    let frame = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const ready = (img: HTMLImageElement | undefined) =>
      !!img && img.complete && img.naturalWidth > 0;

    // If the exact frame hasn't decoded yet, fall back to the nearest one
    // that has, so playback never flashes blank while frames stream in.
    const nearest = (i: number): HTMLImageElement | null => {
      if (ready(images[i])) return images[i];
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (ready(images[i - d])) return images[i - d];
        if (ready(images[i + d])) return images[i + d];
      }
      return null;
    };

    const draw = (i: number) => {
      const img = nearest(i);
      if (!img) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    const startLoading = () => {
      if (loadingStarted) return;
      loadingStarted = true;
      const last = reduced ? 1 : FRAME_COUNT;
      for (let i = 0; i < last; i++) {
        const img = new Image();
        img.onload = () => {
          // First decoded frame: paint immediately so the slot isn't empty.
          if (nearest(0) === img) draw(frame);
        };
        img.src = frameSrc(i);
        images[i] = img;
      }
    };

    if (!reduced) {
      interval = setInterval(() => {
        if (!playing) return;
        frame = (frame + 1) % FRAME_COUNT;
        draw(frame);
      }, 1000 / FPS);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoading();
        playing = entry.isIntersecting;
      },
      // Start fetching frames one viewport early so playback is seamless.
      { rootMargin: "100% 0px", threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      role="img"
      aria-label="Rotating Logos RX compounded medication vial"
      className={className}
    />
  );
}
