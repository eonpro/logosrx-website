"use client";

import Image from "next/image";
import Reveal from "./Reveal";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-7 w-7",
};

const badges = [
  {
    title: "NABP Accredited",
    description: "Verified by the National Association of Boards of Pharmacy.",
    image: "/images/certifications/nabp.png",
  },
  {
    title: "USP 797 Compliant",
    description: "Sterile compounding held to the highest safety standards.",
    // Conical lab flask — sterile preparation environment.
    icon: (
      <svg {...iconProps}>
        <path d="M9 3h6" />
        <path d="M10 3v5L5.6 16.8A2 2 0 0 0 7.4 20h9.2a2 2 0 0 0 1.8-3.2L14 8V3" />
        <path d="M7.6 14h8.8" />
      </svg>
    ),
  },
  {
    title: "USP 795 Compliant",
    description: "Non-sterile compounding follows rigorous protocols.",
    // Mortar & pestle — the classic compounding symbol.
    icon: (
      <svg {...iconProps}>
        <path d="M4 10h16" />
        <path d="M6 10a6 6 0 0 0 12 0" />
        <path d="M12 16v3" />
        <path d="M9 19h6" />
        <path d="M13 9l6-6" />
        <path d="M16 3l3 3" />
      </svg>
    ),
  },
  {
    title: "503A Licensed",
    description: "Federally compliant compounding across 25+ states.",
    // Award medal with ribbon — state licensure / certification.
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="9" r="6" />
        <path d="M9 14.4 7.5 21l4.5-2.6L16.5 21 15 14.4" />
        <path d="M9.6 9l1.7 1.7L15 7" />
      </svg>
    ),
  },
];

const assurances = [
  "Independently accredited",
  "USP-compliant facilities",
  "Licensed in 25+ states",
];

export default function Certifications() {
  return (
    <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
      {/* Ambient brand-colored depth — keeps the light section from reading flat */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-navy/10 to-transparent" />
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-magenta/[0.06] blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-sky/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center mb-14 sm:mb-16">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-magenta/40" />
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta">
              Quality Assurance
            </p>
            <span className="h-px w-8 bg-magenta/40" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Certifications & Compliance
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-navy/60">
            Every preparation is held to nationally recognized pharmacy
            standards—independently accredited, inspected, and licensed across
            the country.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {badges.map((badge, i) => (
            <Reveal
              key={badge.title}
              delay={i * 90}
              className="group relative flex flex-col items-center overflow-hidden rounded-3xl bg-white p-8 text-center ring-1 ring-navy/5 shadow-[0_1px_2px_rgba(38,34,98,0.04),0_12px_32px_-12px_rgba(38,34,98,0.10)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgba(38,34,98,0.05),0_24px_48px_-16px_rgba(198,46,136,0.22)] hover:ring-magenta/15"
            >
              {/* Top accent line, revealed on hover */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-magenta/0 via-magenta to-magenta/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Verified tick */}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="absolute right-5 top-5 h-5 w-5 text-magenta/25 transition-colors duration-300 group-hover:text-magenta"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
                <path
                  d="M8.5 12.2l2.3 2.3 4.7-4.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Emblem zone — unified footprint for icon medallions and the NABP plaque */}
              <div className="mb-6 flex h-20 items-center justify-center">
                {badge.image ? (
                  <span className="flex h-16 items-center justify-center rounded-2xl bg-white px-4 ring-1 ring-navy/10 shadow-sm">
                    <Image
                      src={badge.image}
                      alt={badge.title}
                      width={120}
                      height={40}
                      className="h-7 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-magenta to-magenta-dark text-white shadow-lg shadow-magenta/25 transition-transform duration-300 group-hover:scale-105">
                    {badge.icon}
                    <span
                      aria-hidden
                      className="absolute -inset-1.5 rounded-[1.25rem] ring-1 ring-magenta/15"
                    />
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-navy">{badge.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/60">
                {badge.description}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Closing assurance strip */}
        <Reveal
          delay={badges.length * 90}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-navy/55"
        >
          {assurances.map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="h-1 w-1 rounded-full bg-magenta/40" />
              )}
              {item}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
