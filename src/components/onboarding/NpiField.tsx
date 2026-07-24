"use client";

import { useEffect, useRef, useState } from "react";
import { fieldClass } from "./primitives";
import { lookupNpi } from "@/app/onboarding/actions";
import { normalizeNpi } from "@/lib/npi/checksum";
import type { NpiLookupResult } from "@/lib/npi/parse-nppes";

type Props = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (npi: string) => void;
  onLookup: (provider: NpiLookupResult) => void;
};

/**
 * NPI input that auto-queries the CMS NPPES registry once 10 digits are
 * entered, then prefills the surrounding provider credential fields.
 */
export default function NpiField({
  label = "NPI number",
  placeholder = "NPI #",
  value,
  onChange,
  onLookup,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const lastSuccess = useRef("");
  const onLookupRef = useRef(onLookup);

  useEffect(() => {
    onLookupRef.current = onLookup;
  }, [onLookup]);

  useEffect(() => {
    const npi = normalizeNpi(value);
    if (npi.length !== 10) {
      setStatus("idle");
      setMessage("");
      return;
    }
    if (npi === lastSuccess.current) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setMessage("Looking up NPI…");

      void lookupNpi(npi).then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setStatus("error");
          setMessage(res.error);
          return;
        }
        lastSuccess.current = npi;
        setStatus("ok");
        setMessage("Provider info auto-filled below — review and edit if needed.");
        onLookupRef.current(res.provider);
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className={fieldClass}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(normalizeNpi(e.target.value))}
      />
      {message && (
        <p
          className={`mt-1.5 text-xs ${
            status === "error"
              ? "text-red-600"
              : status === "ok"
                ? "text-navy/55"
                : "text-navy/45"
          }`}
          role="status"
        >
          {status === "loading" ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-plum" />
              {message}
            </span>
          ) : (
            message
          )}
        </p>
      )}
    </label>
  );
}
