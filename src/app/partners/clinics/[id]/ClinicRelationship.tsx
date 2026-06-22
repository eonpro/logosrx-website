"use client";

import { useState, useTransition } from "react";
import {
  addClinicNote,
  setClinicStage,
  setClinicTags,
} from "./actions";

const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "active", label: "Active" },
  { id: "at_risk", label: "At risk" },
  { id: "dormant", label: "Dormant" },
] as const;

export default function ClinicRelationship({
  clinicId,
  stage,
  tags,
}: {
  clinicId: number;
  stage: string;
  tags: string[];
}) {
  const [note, setNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function run(
    work: () => Promise<{ ok: boolean; error?: string }>,
    onOk?: () => void,
    okMsg?: string,
  ) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await work();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        onOk?.();
        if (okMsg) setNotice(okMsg);
      }
    });
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    run(() => setClinicTags(clinicId, [...tags, t]), () => setTagInput(""));
  }

  function removeTag(tag: string) {
    run(() => setClinicTags(clinicId, tags.filter((x) => x !== tag)));
  }

  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="text-sm font-semibold text-navy">Relationship</h2>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-navy/60">Stage</span>
          <select
            value={stage}
            disabled={pending}
            onChange={(e) =>
              run(() => setClinicStage(clinicId, e.target.value))
            }
            className="h-10 w-48 rounded-lg border border-beige bg-cream/50 px-3 text-sm text-navy outline-none focus:border-magenta disabled:opacity-60"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-navy/60">Tags</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-0.5 text-xs font-medium text-navy"
              >
                {tag}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="text-navy/40 hover:text-magenta disabled:opacity-50"
                >
                  ×
                </button>
              </span>
            ))}
            <form
              className="inline-flex"
              onSubmit={(e) => {
                e.preventDefault();
                addTag();
              }}
            >
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag…"
                maxLength={40}
                className="h-7 w-28 rounded-full border border-beige bg-cream/50 px-3 text-xs text-navy outline-none focus:border-magenta"
              />
            </form>
          </div>
        </div>

        <form
          className="flex flex-col gap-2 border-t border-beige pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => addClinicNote(clinicId, note),
              () => setNote(""),
              "Note added.",
            );
          }}
        >
          <span className="text-xs font-medium text-navy/60">Add a note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Log a call, meeting, or context for this account…"
            maxLength={5000}
            className="h-20 resize-none rounded-lg border border-beige bg-cream/50 p-3 text-sm text-navy outline-none focus:border-magenta"
          />
          <button
            type="submit"
            disabled={pending || !note.trim()}
            className="self-start rounded-full bg-magenta px-5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Add note"}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}
