"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function DrivenByExcellence() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="services" className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-navy-deep"
          >
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              preload="none"
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source
                src="https://video.wixstatic.com/video/c49a9b_1b1b71b6d6854065b140aeeadc56db43/720p/mp4/file.mp4"
                type="video/mp4"
              />
            </video>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy leading-tight mb-6">
              Driven by Excellence
            </h2>
            <p className="text-lg leading-relaxed text-navy/60">
              Quality is more than a measure&mdash;it&rsquo;s our foundation. Every process,
              innovation, and detail is designed to ensure precision, safety, and
              reliability. We&rsquo;re committed to empowering providers and improving
              patient outcomes through unwavering excellence in everything we create.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
