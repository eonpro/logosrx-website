"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { STATES_SERVED } from "@/lib/constants";

const inputClass =
  "w-full rounded-full border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/35 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors";

const selectClass =
  "w-full appearance-none rounded-full border border-beige-dark bg-white px-5 py-3 pr-10 text-sm text-navy/35 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors";

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
        <p className="text-navy/50 text-sm max-w-md mx-auto">
          Thank you for your interest in partnering with Logos RX. Our team will review
          your information and reach out within 1&ndash;2 business days.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-beige p-8 sm:p-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          name="clinicName"
          value={form.clinicName}
          onChange={handleChange}
          placeholder="Clinic / Practice name"
          required
          className={inputClass}
        />
        <input
          type="text"
          name="contactName"
          value={form.contactName}
          onChange={handleChange}
          placeholder="Contact name"
          required
          className={inputClass}
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className={inputClass}
        />
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
          className={inputClass}
        />
        <input
          type="text"
          name="npiNumber"
          value={form.npiNumber}
          onChange={handleChange}
          placeholder="NPI Number (optional)"
          className={inputClass}
        />
        <div className="relative">
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="" disabled>Select state</option>
            {STATES_SERVED.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/30" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="relative">
          <select
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
          <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-navy/30" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.5L7 9L10.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="sm:col-span-2">
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about your practice or any questions (optional)"
            rows={4}
            className="w-full rounded-2xl border border-beige-dark bg-white px-5 py-3 text-sm text-navy placeholder:text-navy/35 focus:border-magenta focus:ring-1 focus:ring-magenta outline-none transition-colors resize-none"
          />
        </div>

        {status === "error" && (
          <div className="sm:col-span-2">
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{errorMsg}</p>
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
