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
    description: "National Association of Boards of Pharmacy verified",
    image: "/images/certifications/nabp.png",
  },
  {
    title: "USP 797 Compliant",
    description: "Sterile compounding meets the highest safety standards",
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
    description: "Non-sterile compounding follows rigorous protocols",
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
    description: "Federally compliant compounding pharmacy across 25+ states",
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
    <section className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="text-center mb-16">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
            Quality Assurance
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Certifications & Compliance
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <Reveal
              key={badge.title}
              delay={i * 100}
              className="group relative flex flex-col items-center text-center rounded-2xl bg-white p-8 ring-1 ring-navy/5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-magenta/20"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-linear-to-r from-magenta/0 via-magenta to-magenta/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="mb-6 flex h-16 items-center justify-center">
                {badge.image ? (
                  <Image
                    src={badge.image}
                    alt={badge.title}
                    width={132}
                    height={44}
                    className="h-9 w-auto object-contain"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-magenta/10 text-magenta transition-colors duration-300 group-hover:bg-magenta group-hover:text-white">
                    {badge.icon}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-navy mb-2">{badge.title}</h3>
              <p className="text-sm text-navy/70 leading-relaxed">{badge.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
