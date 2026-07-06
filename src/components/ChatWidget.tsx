"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { track } from "@/lib/analytics";

/**
 * LeadConnector (GoHighLevel) live chat, wrapped in our own UI.
 *
 * The stock widget ships its own launcher bubble that doesn't match the
 * brand, so we:
 *   1. Hide the vendor widget entirely while closed (see the
 *      `chat-widget:not(.lc-open)` rule in globals.css) and render our own
 *      launcher styled like the site's magenta CTAs.
 *   2. Open/close it through LeadConnector's public API
 *      (`window.leadConnector.chatWidget.openWidget()` + `isActive()`), per
 *      https://help.gohighlevel.com — "Web Chat Widget: Public API/Events".
 *   3. Pipe brand colors into the widget's supported CSS custom properties
 *      (`--chat-widget-primary-color` / `--chat-widget-active-color`) so the
 *      expanded chat window matches the brand too.
 *
 * Loading is deferred until first user interaction (or a short idle timeout)
 * so the ~vendor bundle never competes with LCP/INP. If the visitor clicks
 * the launcher before the widget is ready, we show a spinner and auto-open
 * once `LC_chatWidgetLoaded` fires. If the script never loads (ad-blockers,
 * network), the launcher removes itself rather than sit dead on the page.
 */

const WIDGET_ID = "6a4b21721951dd80c1dd97ee";
const LOADER_SRC = "https://widgets.leadconnectorhq.com/loader.js";
const RESOURCES_URL = "https://widgets.leadconnectorhq.com/chat-widget/loader.js";

/**
 * Brand palette (globals.css tokens) mapped onto the widget's CSS custom
 * properties. The widget renders in shadow DOM within our document, so
 * document-level @font-face (Typekit sofia-pro) is usable from inside it.
 * Inline styles on the host element out-rank the widget's own `:host`
 * defaults, which is what makes this override reliable.
 */
const BRAND_FONT =
  '"sofia-pro", "Avenir Next", "Avenir", "Helvetica Neue", Helvetica, "Segoe UI", Roboto, sans-serif';
const BRAND_VARS: Record<string, string> = {
  "--chat-widget-primary-color": "#C62E88", // magenta
  "--chat-widget-primary-solid-color": "#C62E88",
  "--chat-widget-active-color": "#A8266F", // magenta-dark
  "--chat-widget-bubble-color": "#C62E88",
  "--chat-widget-button-color": "#C62E88",
  "--chat-widget-sender-message-color": "#C62E88",
  "--chat-widget-avatar-border-color": "#262262", // navy
  "--chat-widget-header-color": "#262262",
  "--chat-widget-header-darken-color": "#1a1750", // navy-deep
  "--chat-widget-received-message-text-color": "#262262",
  "--chat-widget-welcome-message-text-color": "#262262",
  "--ion-color-primary": "#C62E88",
  "--chat-widget-font-family": BRAND_FONT,
  "--ion-font-family": BRAND_FONT,
};

/** How long a pending open waits for the vendor script before giving up. */
const LOAD_TIMEOUT_MS = 12_000;

interface LeadConnectorChatWidget {
  openWidget: () => void;
  closeWidget?: () => void;
  /** True while the chat window is expanded. */
  isActive?: () => boolean;
}

declare global {
  interface Window {
    leadConnector?: { chatWidget?: LeadConnectorChatWidget };
  }
}

type Status = "idle" | "ready" | "failed";

export default function ChatWidget() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  /** Visitor clicked before the vendor script finished loading. */
  const [waiting, setWaiting] = useState(false);
  const pendingOpen = useRef(false);
  const pollRef = useRef<number | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleClosed = useCallback(() => {
    stopPoll();
    document.querySelector("chat-widget")?.classList.remove("lc-open");
    setOpen(false);
  }, [stopPoll]);

  const openChat = useCallback(() => {
    const api = window.leadConnector?.chatWidget;
    const el = document.querySelector("chat-widget");
    if (!api || !el) return;

    el.classList.add("lc-open");
    api.openWidget();
    pendingOpen.current = false;
    setOpen(true);
    setWaiting(false);
    track("chat_open");

    // The widget fires no "closed" event, so poll `isActive()` to notice the
    // visitor closing it via the widget's own ✕ — then re-hide the vendor
    // element and bring our launcher back. `sawActive` guards against the
    // first ticks where the open animation hasn't registered yet.
    let sawActive = false;
    stopPoll();
    pollRef.current = window.setInterval(() => {
      const active = window.leadConnector?.chatWidget?.isActive?.();
      if (active) {
        sawActive = true;
      } else if (sawActive) {
        handleClosed();
      }
    }, 500);
  }, [handleClosed, stopPoll]);

  // Defer the vendor script until the visitor shows intent (or a short idle
  // pause) so it never competes with first paint / interactivity metrics.
  useEffect(() => {
    if (shouldLoad) return;
    const arm = () => setShouldLoad(true);
    const events = ["pointerdown", "scroll", "keydown", "touchstart"] as const;
    for (const name of events) {
      window.addEventListener(name, arm, { once: true, passive: true });
    }
    const timer = window.setTimeout(arm, 4000);
    return () => {
      for (const name of events) window.removeEventListener(name, arm);
      window.clearTimeout(timer);
    };
  }, [shouldLoad]);

  // Vendor "ready" signal: brand the widget element, mark ready, and fulfil
  // a click that happened while the script was still loading.
  useEffect(() => {
    const onLoaded = () => {
      const el = document.querySelector<HTMLElement>("chat-widget");
      if (el) {
        for (const [prop, value] of Object.entries(BRAND_VARS)) {
          el.style.setProperty(prop, value);
        }
      }
      setStatus("ready");
      if (pendingOpen.current) openChat();
    };
    window.addEventListener("LC_chatWidgetLoaded", onLoaded, false);
    return () => window.removeEventListener("LC_chatWidgetLoaded", onLoaded);
  }, [openChat]);

  // A pending open that never resolves means the script is blocked — remove
  // the launcher instead of leaving a dead button.
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => {
      pendingOpen.current = false;
      setStatus((s) => (s === "ready" ? s : "failed"));
      setWaiting(false);
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [waiting]);

  useEffect(() => stopPoll, [stopPoll]);

  if (status === "failed") return null;

  const onLauncherClick = () => {
    if (status === "ready") {
      openChat();
      return;
    }
    pendingOpen.current = true;
    setShouldLoad(true);
    setWaiting(true);
  };

  return (
    <>
      {shouldLoad && (
        <Script
          src={LOADER_SRC}
          strategy="afterInteractive"
          data-resources-url={RESOURCES_URL}
          data-widget-id={WIDGET_ID}
          data-source="WEB_USER"
          onError={() => setStatus("failed")}
        />
      )}

      <button
        type="button"
        onClick={onLauncherClick}
        aria-label="Chat with us"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Chat with us — available 24/7"
        className={`chat-launcher fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-magenta text-white shadow-lg shadow-magenta/40 transition-all duration-300 hover:bg-magenta-dark hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 ${
          open ? "pointer-events-none scale-75 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {waiting ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="animate-spin"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.5c-4.7 0-8.5 3.36-8.5 7.5 0 1.94.83 3.7 2.2 5.03-.17 1.13-.63 2.27-1.5 3.13a.47.47 0 0 0 .3.8c1.8.1 3.4-.5 4.55-1.24.92.28 1.9.43 2.95.43 4.7 0 8.5-3.36 8.5-7.5s-3.8-7.5-8.5-7.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="8.4" cy="11" r="1.1" fill="currentColor" />
            <circle cx="12" cy="11" r="1.1" fill="currentColor" />
            <circle cx="15.6" cy="11" r="1.1" fill="currentColor" />
          </svg>
        )}
      </button>
    </>
  );
}
