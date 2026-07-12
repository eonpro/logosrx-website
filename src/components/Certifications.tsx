"use client";

import Image from "next/image";
import Reveal from "./Reveal";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-9 w-9",
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
    description: "Federally compliant compounding across multiple states.",
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

export default function Certifications() {
  return (
    <section className="relative overflow-hidden bg-cream py-24 sm:py-32">
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-magenta/40" />
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta">
              Quality Assurance
            </p>
            <span className="h-px w-8 bg-magenta/40" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.05] text-navy">
            Certifications & Compliance
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-navy/60">
            Every preparation is held to nationally recognized pharmacy
            standards—independently accredited, inspected, and licensed across
            the country.
          </p>
        </Reveal>

        {/* Editorial credential row — a hairline-framed spec sheet, not a stack of boxes */}
        <div className="mt-16 grid grid-cols-1 border-y border-navy/10 sm:grid-cols-2 sm:divide-x sm:divide-navy/10 lg:grid-cols-4">
          {badges.map((badge, i) => (
            <Reveal
              key={badge.title}
              delay={i * 90}
              className="group flex flex-col items-center px-6 py-12 text-center [&:not(:first-child)]:border-t [&:not(:first-child)]:border-navy/10 sm:[&:nth-child(-n+2)]:border-t-0 lg:[&:not(:first-child)]:border-t-0"
            >
              <div className="flex h-12 items-center justify-center text-magenta transition-transform duration-300 ease-out group-hover:-translate-y-1">
                {badge.image ? (
                  <Image
                    src={badge.image}
                    alt={badge.title}
                    width={132}
                    height={44}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  badge.icon
                )}
              </div>

              <h3 className="mt-6 text-base font-medium tracking-tight text-navy">
                {badge.title}
              </h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-navy/55">
                {badge.description}
              </p>

              {/* Quiet underline that draws in on hover — motion in place of a box */}
              <span
                aria-hidden
                className="mt-5 h-px w-8 origin-center scale-x-50 bg-magenta/50 opacity-60 transition-all duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
