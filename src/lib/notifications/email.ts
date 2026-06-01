import "server-only";
import { log } from "@/lib/observability/logger";

/**
 * Minimal transactional email sender built on Resend's HTTP API.
 *
 * Configure:
 *   - `RESEND_API_KEY`   (required to actually send)
 *   - `EMAIL_FROM`       (e.g. "Logos RX <noreply@logosrx.com>"; the domain must
 *                         be verified in Resend)
 *
 * When `RESEND_API_KEY` is unset the helper no-ops with a single warning so the
 * surrounding flow (e.g. clinic approval) never fails because email isn't wired
 * up yet. No SDK dependency — we POST to the REST endpoint directly.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Logos RX <noreply@logosrx.com>";

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  if (!args.to) return false;
  if (!RESEND_API_KEY) {
    log.warn("email send skipped: RESEND_API_KEY not set", {
      subject: args.subject,
    });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      log.warn("email send failed", { status: res.status });
      return false;
    }
    return true;
  } catch (err) {
    log.warn("email send threw", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

/** Approval email sent to a clinic when an admin verifies their account. */
export async function sendClinicApprovedEmail(args: {
  to: string;
  contactName: string;
  clinicName: string;
}): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.logosrx.com";
  const greetingName = args.contactName?.trim() || "there";
  const clinic = args.clinicName?.trim() || "your clinic";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">You're approved! 🎉</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p>Great news — <strong>${escapeHtml(clinic)}</strong> has been verified and approved on the Logos RX provider platform. Your account is now active.</p>
    <p>You can sign in to your provider portal to manage your profile and start placing orders:</p>
    <p><a href="${base}/sign-in" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">Go to your portal</a></p>
    <p style="color:#262262;opacity:.7;font-size:13px">If you have any questions, just reply to this email.</p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `You're approved!\n\nHi ${greetingName},\n\n${clinic} has been verified and approved on the Logos RX provider platform. Your account is now active.\n\nSign in to your portal: ${base}/sign-in\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: "Your Logos RX account is approved",
    html,
    text,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
