import Link from "next/link";
import Image from "next/image";
import { CONTACT, HOURS, NAV_LINKS, LEGAL_LINKS, SITE, STATES_SERVED } from "@/lib/constants";

export default function Footer() {
  return (
    <footer id="contact" className="bg-navy-deep text-white" data-header-theme="dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Column 1 — Branding */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/images/logo-white.svg"
              alt={SITE.name}
              width={180}
              height={57}
              className="h-10 w-auto sm:h-12 mb-6"
            />

            {/* Certification badge */}
            <div className="mb-6">
              <Image
                src="/images/certifications/nabp.svg"
                alt="NABP - National Association of Boards of Pharmacy"
                width={200}
                height={66}
                className="h-14 w-auto"
              />
            </div>

            <p className="text-sm text-white/50 leading-relaxed mb-4">
              {SITE.name} is a multi-state licensed 503A compounding pharmacy with
              sterile and non-sterile compounding labs.
            </p>
          </div>

          {/* Column 2 — Headquarters */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-sky mb-6">
              Headquarters
            </h4>
            <address className="not-italic space-y-3 text-sm text-white/70">
              <p>{CONTACT.address.street}</p>
              <p>{CONTACT.address.city}, {CONTACT.address.state} {CONTACT.address.zip}</p>
              <p className="pt-2">
                <a href={CONTACT.phoneHref} className="hover:text-white transition-colors">
                  {CONTACT.phone}
                </a>
              </p>
              <p>Fax: {CONTACT.fax}</p>
              <p>
                <a href={CONTACT.emailHref} className="hover:text-white transition-colors">
                  {CONTACT.email}
                </a>
              </p>
            </address>
          </div>

          {/* Column 3 — Company */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-sky mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Hours */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-sky mb-6">
              Hours of Operation
            </h4>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-white/90">Retail</dt>
                <dd className="text-white/60">{HOURS.retail}</dd>
              </div>
              <div>
                <dt className="font-medium text-sky">Online</dt>
                <dd className="text-sky/80">{HOURS.online}</dd>
              </div>
              <div>
                <dt className="font-medium text-sky">Chat Support</dt>
                <dd className="text-sky/80">{HOURS.chat}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-nowrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/40 whitespace-nowrap">
            <span className="font-semibold text-sky/60">Legal</span>
            {LEGAL_LINKS.map((link, i) => (
              <span key={link.href} className="flex items-center gap-4">
                {i > 0 && <span>|</span>}
                <Link href={link.href} className="hover:text-white/70 transition-colors">
                  {link.label}
                </Link>
              </span>
            ))}
          </div>

          <p className="text-xs text-white/30">
            All rights reserved {SITE.name} &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
