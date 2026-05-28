"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { benefits, openPositions } from "@/data/careers";
import { SITE } from "@/lib/constants";

function HeroSection() {
  return (
    <section className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-6">
              Join the Logos RX family
            </h1>
            <p className="text-lg text-navy/70 max-w-md">
              Help us improve patient outcomes through personalized compounding excellence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-navy via-navy-light to-navy-deep"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-3 p-10 opacity-20">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg bg-white/20" />
                ))}
              </div>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/80 text-sm">
                State-of-the-art compounding facility in Tampa, FL
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CultureSection() {
  return (
    <section className="bg-navy-deep py-24 sm:py-32 overflow-hidden" data-header-theme="dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-magenta mb-4">
              Culture
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Great talent, united by purpose.
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Our team comes from many different backgrounds, but what brings us
              together is our passion for excellence and our commitment to quality
              healthcare. At Logos RX, every team member plays a vital role in
              improving patient outcomes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="grid grid-cols-8 gap-3">
              {[...Array(48)].map((_, i) => {
                const isHighlighted = [5, 12, 19, 22, 30, 37, 41].includes(i);
                return (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full ${
                      isHighlighted ? "bg-magenta/60" : "bg-white/5"
                    }`}
                  />
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-magenta mb-4">
            Benefits
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            We take care of our people.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl p-8 sm:p-10"
            >
              <span className="text-2xl font-bold text-navy/20 mb-4 block">
                {benefit.number}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-navy mb-3">
                {benefit.title}
              </h3>
              <p className="text-sm text-navy/70 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  jobTitle?: string;
}

function ApplyModal({ open, onClose, jobTitle }: ApplyModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    referralSource: "",
    willingToRelocate: "",
    // Honeypot field — humans never see/fill this.
    company_website: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Radix Dialog handles body-scroll lock, focus trap, escape close, and
  // restoring focus to the trigger button. We only need to reset the form
  // when the modal closes.

  useEffect(() => {
    if (!open) {
      setForm({ firstName: "", lastName: "", email: "", phone: "", referralSource: "", willingToRelocate: "", company_website: "" });
      setResume(null);
      setStatus("idle");
      setErrorMsg("");
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const data = new FormData();
      data.append("firstName", form.firstName);
      data.append("lastName", form.lastName);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("position", jobTitle || "General Application");
      if (form.referralSource) data.append("referralSource", form.referralSource);
      if (form.willingToRelocate) data.append("willingToRelocate", form.willingToRelocate);
      if (form.company_website) data.append("company_website", form.company_website);
      if (resume) data.append("resume", resume);

      const res = await fetch("/api/applications", { method: "POST", body: data });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Submission failed");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              aria-describedby="apply-modal-description"
              onOpenAutoFocus={(e) => {
                // Don't auto-focus the close button; let the first form field
                // receive focus instead via the form's natural tab order.
                e.preventDefault();
                const firstInput = document.getElementById("apply-first-name");
                firstInput?.focus();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl focus:outline-none"
              >
                <Dialog.Title id="apply-modal-title" className="sr-only">
                  Apply for a position
                </Dialog.Title>
                <Dialog.Close
                  className="absolute top-5 right-5 z-10 flex items-center justify-center w-8 h-8 rounded-full hover:bg-beige focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Dialog.Close>

              <div className="p-8 sm:p-10">
                {status === "success" ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M10 16l4 4 8-8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-navy mb-2">Application submitted!</h2>
                    <p className="text-navy/70 text-sm mb-6">We&rsquo;ll review your application and get back to you soon.</p>
                    <button onClick={onClose} className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
                      Apply now
                    </h2>
                    <p id="apply-modal-description" className="text-navy/65 text-sm mb-2">
                      Tell us a little more about you.
                    </p>
                    <p className="text-navy/55 text-xs mb-6">
                      Fields marked with <span className="text-magenta">*</span> are required.
                    </p>

                    <form
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      onSubmit={handleSubmit}
                      noValidate
                      aria-describedby={status === "error" ? "apply-error" : undefined}
                    >
                      <input
                        type="text"
                        name="company_website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.company_website}
                        onChange={handleChange}
                        aria-hidden="true"
                        className="absolute h-0 w-0 -left-[9999px] opacity-0 pointer-events-none sm:col-span-2"
                      />
                      <div>
                        <label htmlFor="apply-first-name" className="sr-only">
                          First name (required)
                        </label>
                        <input
                          id="apply-first-name"
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          placeholder="First name *"
                          required
                          autoComplete="given-name"
                          aria-required="true"
                          aria-invalid={status === "error" ? "true" : undefined}
                          className="w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/55 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="apply-last-name" className="sr-only">
                          Last name (required)
                        </label>
                        <input
                          id="apply-last-name"
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          placeholder="Last name *"
                          required
                          autoComplete="family-name"
                          aria-required="true"
                          aria-invalid={status === "error" ? "true" : undefined}
                          className="w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/55 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="apply-email" className="sr-only">
                          Email (required)
                        </label>
                        <input
                          id="apply-email"
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="Email *"
                          required
                          autoComplete="email"
                          aria-required="true"
                          aria-invalid={status === "error" ? "true" : undefined}
                          className="w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/55 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="apply-phone" className="sr-only">
                          Phone (required)
                        </label>
                        <input
                          id="apply-phone"
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Phone *"
                          required
                          autoComplete="tel"
                          aria-required="true"
                          aria-invalid={status === "error" ? "true" : undefined}
                          className="w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/55 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        />
                      </div>

                      <div className="relative">
                        <label htmlFor="apply-referral" className="sr-only">
                          How did you hear about us?
                        </label>
                        <select
                          id="apply-referral"
                          name="referralSource"
                          value={form.referralSource}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-full border border-beige-dark bg-white px-5 py-3 pr-10 text-sm text-navy/70 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        >
                          <option value="" disabled>How did you hear about us?</option>
                          <option value="search">Search Engine</option>
                          <option value="social">Social Media</option>
                          <option value="referral">Referral</option>
                          <option value="job-board">Job Board</option>
                          <option value="other">Other</option>
                        </select>
                        <svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/65" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="relative">
                        <label htmlFor="apply-relocate" className="sr-only">
                          Willing to relocate?
                        </label>
                        <select
                          id="apply-relocate"
                          name="willingToRelocate"
                          value={form.willingToRelocate}
                          onChange={handleChange}
                          className="w-full appearance-none rounded-full border border-beige-dark bg-white px-5 py-3 pr-10 text-sm text-navy/70 focus:border-magenta focus:ring-2 focus:ring-magenta/40 outline-none transition-colors"
                        >
                          <option value="" disabled>Are you willing to relocate?</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        <svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/65" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="sm:col-span-2 mt-2">
                        <p id="resume-upload-label" className="text-sm font-semibold text-navy mb-3">
                          Resume upload
                        </p>
                        <input
                          ref={fileInputRef}
                          id="apply-resume"
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          className="sr-only"
                          aria-describedby="resume-upload-hint"
                          onChange={(e) => setResume(e.target.files?.[0] || null)}
                        />
                        <div
                          role="button"
                          tabIndex={0}
                          aria-labelledby="resume-upload-label"
                          aria-describedby="resume-upload-hint"
                          className="w-full rounded-2xl border-2 border-dashed border-beige-dark bg-cream/50 px-6 py-8 text-center hover:border-magenta/40 focus:border-magenta focus:outline-none focus:ring-2 focus:ring-magenta/30 transition-colors cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const file = e.dataTransfer.files[0];
                            if (file) setResume(file);
                          }}
                        >
                          {resume ? (
                            <p className="text-sm text-navy font-medium">{resume.name}</p>
                          ) : (
                            <>
                              <p className="text-sm text-navy/65 mb-2">
                                Drop files here or
                              </p>
                              <span className="inline-flex items-center rounded-full bg-magenta px-5 py-2 text-sm font-semibold text-white">
                                Select files
                              </span>
                            </>
                          )}
                        </div>
                        <p id="resume-upload-hint" className="text-xs text-navy/55 mt-2">
                          Max. file size: 25 MB. PDF, DOC, or DOCX.
                        </p>
                      </div>

                      {status === "error" && (
                        <div className="sm:col-span-2">
                          <p
                            id="apply-error"
                            role="alert"
                            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2"
                          >
                            {errorMsg}
                          </p>
                        </div>
                      )}

                      <div className="sm:col-span-2 mt-2">
                        <button
                          type="submit"
                          disabled={status === "loading"}
                          className="w-full rounded-full bg-magenta py-3.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {status === "loading" ? "Submitting..." : "Submit"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function OpenPositionsSection({ onApply }: { onApply: (title: string) => void }) {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-14"
        >
          Open Positions
        </motion.h2>

        <div className="divide-y divide-beige">
          {openPositions.map((job, i) => (
            <motion.div
              key={`${job.title}-${i}`}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6 first:pt-0"
            >
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-navy mb-3 lg:mb-2">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-block rounded-md bg-navy px-3 py-1 text-xs font-semibold text-white">
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-navy/70">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <path d="M7 1.5C4.52 1.5 2.5 3.52 2.5 6c0 3.38 4.5 6.5 4.5 6.5s4.5-3.12 4.5-6.5c0-2.48-2.02-4.5-4.5-4.5Zm0 6.1a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2Z" fill="currentColor"/>
                    </svg>
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-navy/70">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      <path d="M7 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {job.shift}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onApply(job.title)}
                className="inline-flex items-center justify-center rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors self-start lg:self-auto"
              >
                Apply Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-magenta py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L42 38H6L24 4Z" fill="white" opacity="0.8" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Where health and partnership meet
          </h2>
        </div>
        <a
          href={SITE.onboarding}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-magenta hover:bg-white/90 transition-colors"
        >
          New Provider
        </a>
      </div>
    </section>
  );
}

export default function CareersContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | undefined>();

  function handleApply(title: string) {
    setSelectedJob(title);
    setModalOpen(true);
  }

  return (
    <>
      <HeroSection />
      <CultureSection />
      <BenefitsSection />
      <OpenPositionsSection onApply={handleApply} />
      <CtaBanner />
      <ApplyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        jobTitle={selectedJob}
      />
    </>
  );
}
