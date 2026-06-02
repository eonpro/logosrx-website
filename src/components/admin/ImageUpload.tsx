"use client";

import { useRef, useState } from "react";

/**
 * Admin image picker: uploads to the merchandising blob store and reports the
 * resulting public URL back to the parent via `onChange`. Shows a live preview
 * of the current value.
 */
export default function ImageUpload({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/merchandising/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="text-xs font-medium text-navy/60">
      {label}
      <div className="mt-1 flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-beige-dark bg-white">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-[10px] text-navy/30">No image</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-beige-dark px-3 py-1.5 text-xs font-semibold text-navy/70 hover:bg-beige disabled:opacity-50"
            >
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
