"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteRecipient } from "../actions";

const inputClass =
  "w-full rounded-lg border border-beige-dark bg-white px-3 py-2 text-sm text-navy outline-none focus:border-magenta focus:ring-1 focus:ring-magenta";

export default function RecipientEditor({
  id,
  clinicName,
  contactName,
  email,
}: {
  id: number;
  clinicName: string | null;
  contactName: string | null;
  email: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clinicName: clinicName ?? "",
    contactName: contactName ?? "",
    email,
  });

  function open() {
    setForm({
      clinicName: clinicName ?? "",
      contactName: contactName ?? "",
      email,
    });
    setError("");
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await updateQuoteRecipient(id, form);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error ?? "Could not save changes.");
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={open}
        className="rounded-full border border-beige-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-beige/50"
      >
        Edit recipient
      </button>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-navy/60">Clinic name</label>
          <input
            value={form.clinicName}
            onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
            className={inputClass}
            placeholder="Acme Wellness"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-navy/60">Contact name</label>
          <input
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
            className={inputClass}
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-navy/60">
            Recipient email <span className="text-magenta">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="jane@acmewellness.com"
            required
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-magenta px-5 py-2 text-sm font-semibold text-white hover:bg-magenta/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="rounded-full border border-beige-dark px-5 py-2 text-sm font-semibold text-navy hover:bg-beige/50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
