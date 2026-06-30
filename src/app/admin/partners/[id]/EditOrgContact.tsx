"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePartnerOrgContact } from "../actions";

interface ContactProps {
  id: number;
  orgName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
}

const inputClass =
  "h-10 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta";

/**
 * Inline editor for a partner org's contact details. Most useful for fixing a
 * duplicate phone number that blocks approval, but covers any contact change.
 * Collapsed by default so it doesn't clutter the header.
 */
export default function EditOrgContact({
  org,
  defaultOpen = false,
}: {
  org: ContactProps;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [orgName, setOrgName] = useState(org.orgName);
  const [contactName, setContactName] = useState(org.contactName);
  const [email, setEmail] = useState(org.email);
  const [phone, setPhone] = useState(org.phone);
  const [website, setWebsite] = useState(org.website);

  function save() {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await updatePartnerOrgContact(org.id, {
        orgName,
        contactName,
        email,
        phone,
        website,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
      } else {
        setNotice("Contact details updated.");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex rounded-full border border-beige px-4 py-1.5 text-xs font-semibold text-navy/70 transition-colors hover:border-navy/30"
      >
        Edit contact details
      </button>
    );
  }

  return (
    <div className="mt-4 max-w-2xl rounded-2xl border border-beige bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">
            Organization name
          </span>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Contact name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            placeholder="(555) 123-4567"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium text-navy/60">
            Website (optional)
          </span>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            maxLength={255}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save details"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError("");
            setNotice("");
          }}
          className="h-10 rounded-full border border-beige px-5 text-sm font-semibold text-navy/70 transition-colors hover:border-navy/30 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}
    </div>
  );
}
