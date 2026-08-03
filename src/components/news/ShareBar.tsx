"use client";

import { useState } from "react";

interface ShareBarProps {
  title: string;
  url: string;
}

export default function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures (permissions / insecure context).
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }
    await copyLink();
  }

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void nativeShare()}
        className="inline-flex h-9 items-center rounded-full bg-navy px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Share
      </button>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3 text-sm text-navy/70 hover:text-navy transition-colors"
      >
        LinkedIn
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3 text-sm text-navy/70 hover:text-navy transition-colors"
      >
        X
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3 text-sm text-navy/70 hover:text-navy transition-colors"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
