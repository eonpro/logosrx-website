"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="bg-gradient-to-r from-navy-deep to-navy py-16 sm:py-20" data-header-theme="dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="text-center lg:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Stay in the loop
            </h3>
            <p className="text-white/60 text-sm sm:text-base">
              Get updates on new formulations, provider resources, and industry insights.
            </p>
          </div>

          {submitted ? (
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-8 py-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-magenta-light">
                <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-white font-medium text-sm">
                You&rsquo;re subscribed!
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 rounded-l-full bg-white/10 border border-white/20 px-6 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-magenta transition-colors"
              />
              <button
                type="submit"
                className="rounded-r-full bg-magenta px-6 py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
              >
                Subscribe
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
