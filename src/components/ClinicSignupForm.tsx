"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { US_STATE_CODES } from "@/lib/constants";

const inputClass =
  "w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/65 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors";

const selectClass =
  "w-full appearance-none rounded-full border border-beige-dark bg-white px-5 py-3 pr-10 text-sm text-navy/65 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors";

export default function ClinicSignupForm() {
  const [form, setForm] = useState({
    clinicName: "",
    contactName: "",
    email: "",
    phone: "",
    npiNumber: "",
    state: "",
    specialty: "",
    message: "",
    // Honeypot — humans never set this. Bots that fill every input will trip it.
    company_website: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/clinic-signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
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

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white border border-beige p-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M10 16l4 4 8-8" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-navy mb-2">Request submitted!</h3>
        <p className="text-navy/70 text-sm max-w-md mx-auto">
          Thank you for your interest in partnering with Logos RX. Our team will review
          your information and reach out within 1&ndash;2 business days.
        </p>
      </motion.div>
    );
  }

  const errorId = "clinic-signup-error";
  const hasError = status === "error";
  const labelClass = "sr-only";
  const requiredMark = (
    <span aria-hidden="true" className="ml-0.5 text-magenta">
      *
    </span>
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={hasError ? errorId : undefined}
      className="rounded-2xl bg-white border border-beige p-8 sm:p-10"
    >
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        value={form.company_website}
        onChange={handleChange}
        aria-hidden="true"
        className="absolute h-0 w-0 -left-[9999px] opacity-0 pointer-events-none"
      />
      <p className="mb-4 text-xs text-navy/55">
        Fields marked with <span className="text-magenta">*</span> are required.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="clinic-name" className={labelClass}>
            Clinic or practice name{requiredMark}
          </label>
          <input
            id="clinic-name"
            type="text"
            name="clinicName"
            value={form.clinicName}
            onChange={handleChange}
            placeholder="Clinic / Practice name *"
            required
            autoComplete="organization"
            aria-required="true"
            aria-invalid={hasError ? "true" : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Contact name{requiredMark}
          </label>
          <input
            id="contact-name"
            type="text"
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
            placeholder="Contact name *"
            required
            autoComplete="name"
            aria-required="true"
            aria-invalid={hasError ? "true" : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="clinic-email" className={labelClass}>
            Email address{requiredMark}
          </label>
          <input
            id="clinic-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email *"
            required
            autoComplete="email"
            aria-required="true"
            aria-invalid={hasError ? "true" : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="clinic-phone" className={labelClass}>
            Phone number{requiredMark}
          </label>
          <input
            id="clinic-phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone *"
            required
            autoComplete="tel"
            aria-required="true"
            aria-invalid={hasError ? "true" : undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="clinic-npi" className={labelClass}>
            NPI number (optional)
          </label>
          <input
            id="clinic-npi"
            type="text"
            name="npiNumber"
            value={form.npiNumber}
            onChange={handleChange}
            placeholder="NPI Number (optional)"
            inputMode="numeric"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="clinic-state" className={labelClass}>
            State
          </label>
          <div className="relative">
            <select
              id="clinic-state"
              name="state"
              value={form.state}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="" disabled>Select state</option>
              {US_STATE_CODES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/65" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div>
          <label htmlFor="clinic-specialty" className={labelClass}>
            Specialty (optional)
          </label>
          <div className="relative">
            <select
              id="clinic-specialty"
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="" disabled>Specialty (optional)</option>
              <option value="primary-care">Primary Care</option>
              <option value="dermatology">Dermatology</option>
              <option value="endocrinology">Endocrinology</option>
              <option value="urology">Urology</option>
              <option value="obgyn">OB/GYN</option>
              <option value="pain-management">Pain Management</option>
              <option value="anti-aging">Anti-Aging / Wellness</option>
              <option value="functional-medicine">Functional Medicine</option>
              <option value="veterinary">Veterinary</option>
              <option value="other">Other</option>
            </select>
            <svg aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/65" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="clinic-message" className={labelClass}>
            Additional details (optional)
          </label>
          <textarea
            id="clinic-message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about your practice or any questions (optional)"
            rows={4}
            className="w-full rounded-2xl border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/65 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors resize-none"
          />
        </div>

        {hasError && (
          <div className="sm:col-span-2">
            <p
              id={errorId}
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
            {status === "loading" ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </form>
  );
}
