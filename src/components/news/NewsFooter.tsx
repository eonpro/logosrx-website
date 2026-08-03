import { CONTACT, SITE } from "@/lib/constants";

export default function NewsFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-black/5 bg-[#f7f6f4]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">Connect</h3>
          <ul className="space-y-2 text-sm text-navy/65">
            <li>
              <a href="https://www.logosrx.com" className="hover:text-navy transition-colors">
                Logos RX
              </a>
            </li>
            <li>
              <a
                href="https://www.logosrx.com/providers"
                className="hover:text-navy transition-colors"
              >
                Providers
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="hover:text-navy transition-colors">
                Media relations
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">Company</h3>
          <ul className="space-y-2 text-sm text-navy/65">
            <li>
              <a href="https://www.logosrx.com/about" className="hover:text-navy transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="https://www.logosrx.com/careers" className="hover:text-navy transition-colors">
                Careers
              </a>
            </li>
            <li>
              <a
                href="https://www.logosrx.com/partners"
                className="hover:text-navy transition-colors"
              >
                Partner program
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy mb-3">Contact</h3>
          <address className="not-italic text-sm text-navy/65 leading-relaxed">
            <p>{CONTACT.address.full}</p>
            <p className="mt-2">
              <a href={CONTACT.phoneHref} className="hover:text-navy transition-colors">
                {CONTACT.phone}
              </a>
            </p>
            <p>
              <a href={CONTACT.emailHref} className="hover:text-navy transition-colors">
                {CONTACT.email}
              </a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-black/5">
        <p className="mx-auto max-w-6xl px-5 py-5 sm:px-8 text-xs text-navy/45">
          © {year} {SITE.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
