"use client";

import { useState } from "react";
import Reveal from "./Reveal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  // Honeypot: hidden field that bots tend to fill. Humans never see/touch it.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/email-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company_website: companyWebsite }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-gradient-to-r from-navy-deep to-navy py-16 sm:py-20" data-header-theme="dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal
          rootMargin="-30px 0px"
          className="flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Stay in the loop
            </h3>
            <p className="text-white/85 text-sm sm:text-base">
              Get updates on new formulations, provider resources, and industry insights.
            </p>
          </div>

          {status === "success" ? (
            <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-full bg-white/10 px-8 py-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-magenta-light" aria-hidden="true">
                <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white font-medium text-sm">
                You&rsquo;re subscribed!
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-describedby={status === "error" ? "newsletter-error" : undefined}
              className="flex w-full max-w-md flex-col gap-2"
            >
              <div className="flex">
                <input
                  type="text"
                  name="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  aria-hidden="true"
                  className="absolute h-0 w-0 -left-[9999px] opacity-0 pointer-events-none"
                />
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={status === "error" ? "true" : undefined}
                  className="flex-1 rounded-l-full bg-white/10 border border-white/20 px-6 py-3.5 text-sm text-white placeholder:text-white/80 focus:outline-none focus:border-magenta focus:ring-2 focus:ring-magenta/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-r-full bg-magenta px-6 py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors disabled:opacity-60"
                >
                  {status === "loading" ? "..." : status === "error" ? "Retry" : "Subscribe"}
                </button>
              </div>
              {status === "error" && (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="text-xs text-red-200"
                >
                  We couldn&rsquo;t subscribe you. Please check your email and try again.
                </p>
              )}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
