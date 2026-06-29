import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { CONTACT, SITE_URL } from "@/lib/constants";
import { log } from "@/lib/observability/logger";

/**
 * Transactional email sender.
 *
 * Two transports are supported; the active one is chosen at send time:
 *   - RESEND (preferred) — set `RESEND_API_KEY`. Production-ready after you
 *     verify the `EMAIL_FROM` domain in Resend; no AWS SES sandbox to escape.
 *   - AWS SES (fallback) — set `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY`
 *     (+ optional `SES_REGION`, default us-east-1). Used when Resend isn't
 *     configured, or when `EMAIL_PROVIDER=ses` forces it.
 *
 * Selection: Resend if `RESEND_API_KEY` is set, unless `EMAIL_PROVIDER` pins a
 * specific transport (`resend` | `ses`). `EMAIL_FROM` (e.g. "Logos RX
 * <noreply@logosrx.com>") must be a verified sender on whichever transport is
 * active.
 *
 * When no transport is configured the helper no-ops with a single warning so
 * the surrounding flow (e.g. clinic approval) never fails because email isn't
 * wired up yet.
 */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "Logos RX <noreply@logosrx.com>";

let _client: SESv2Client | null = null;

function getClient(): SESv2Client | null {
  const region = process.env.SES_REGION ?? "us-east-1";
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  if (!_client) {
    _client = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Picks the transport: an explicit `EMAIL_PROVIDER` wins; otherwise Resend when
 * its key is present, else SES.
 */
function activeProvider(): "resend" | "ses" | "none" {
  const override = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (override === "resend") return "resend";
  if (override === "ses") return "ses";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY) {
    return "ses";
  }
  return "none";
}

/** Sends via the Resend HTTP API (no SDK dependency). */
async function sendViaResend(args: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn("email send skipped: RESEND_API_KEY not set", {
      subject: args.subject,
    });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.text ? { text: args.text } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      log.warn("resend send failed", {
        status: res.status,
        detail: detail.slice(0, 300),
      });
      return false;
    }
    return true;
  } catch (err) {
    log.warn("resend send threw", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

/** Sends via AWS SES (v2). */
async function sendViaSes(args: SendEmailArgs): Promise<boolean> {
  const client = getClient();
  if (!client) {
    log.warn("email send skipped: SES credentials not set", {
      subject: args.subject,
    });
    return false;
  }
  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: EMAIL_FROM,
        Destination: { ToAddresses: [args.to] },
        Content: {
          Simple: {
            Subject: { Data: args.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: args.html, Charset: "UTF-8" },
              ...(args.text
                ? { Text: { Data: args.text, Charset: "UTF-8" } }
                : {}),
            },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    log.warn("email send threw", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  if (!args.to) return false;
  const provider = activeProvider();
  if (provider === "resend") return sendViaResend(args);
  if (provider === "ses") return sendViaSes(args);
  log.warn("email send skipped: no email provider configured", {
    subject: args.subject,
  });
  return false;
}

/**
 * Approval email sent to a clinic when an admin verifies their account.
 *
 * When `activateUrl` is provided it points to a one-time activation link that
 * signs the clinic in and lets them set their own password (and verifies their
 * email). This is what makes a login usable for clinics that were onboarded by
 * a Logos RX rep — they never chose a password during intake. When the link
 * can't be minted we fall back to a plain sign-in link.
 */
export async function sendClinicApprovedEmail(args: {
  to: string;
  contactName: string;
  clinicName: string;
  activateUrl?: string;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.contactName?.trim() || "there";
  const clinic = args.clinicName?.trim() || "your clinic";
  const hasActivate = Boolean(args.activateUrl);
  const ctaUrl = args.activateUrl ?? `${base}/sign-in`;
  const ctaLabel = hasActivate ? "Activate your account" : "Go to your portal";

  const accessLine = hasActivate
    ? "Click below to activate your login — you'll set your password and get instant access to your provider portal:"
    : "You can sign in to your provider portal to manage your profile and start placing orders:";
  const expiryNote = hasActivate
    ? `<p style="color:#262262;opacity:.7;font-size:13px">This activation link is valid for 7 days. If it expires, use “Forgot password” on the <a href="${base}/sign-in" style="color:#E6007E">sign-in page</a> to set a new password.</p>`
    : "";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">You're approved! 🎉</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p>Great news — <strong>${escapeHtml(clinic)}</strong> has been verified and approved on the Logos RX provider platform. Your account is now active.</p>
    <p>${accessLine}</p>
    <p><a href="${ctaUrl}" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">${ctaLabel}</a></p>
    ${expiryNote}
    <p style="color:#262262;opacity:.7;font-size:13px">If you have any questions, just reply to this email.</p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const textAccess = hasActivate
    ? `Activate your account and set your password: ${ctaUrl}\n\nThis activation link is valid for 7 days. If it expires, use "Forgot password" on ${base}/sign-in.`
    : `Sign in to your portal: ${ctaUrl}`;
  const text = `You're approved!\n\nHi ${greetingName},\n\n${clinic} has been verified and approved on the Logos RX provider platform. Your account is now active.\n\n${textAccess}\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: "Your Logos RX account is approved",
    html,
    text,
  });
}

/**
 * Approval email sent to a partner org owner when an admin approves their
 * affiliate application. The activation link signs them in and lets them set
 * a password (the account was provisioned with a throwaway one).
 */
export async function sendPartnerApprovedEmail(args: {
  to: string;
  contactName: string;
  orgName: string;
  activateUrl?: string;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.contactName?.trim() || "there";
  const org = args.orgName?.trim() || "your organization";
  const ctaUrl = args.activateUrl ?? `${base}/partners/sign-in`;
  const ctaLabel = args.activateUrl ? "Activate your account" : "Go to the partner portal";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">Welcome to the Logos RX partner program!</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p><strong>${escapeHtml(org)}</strong> has been approved as a Logos RX affiliate partner. From your portal you can generate referral links, invite reps, track transactions and commissions, and see your payouts.</p>
    <p><a href="${ctaUrl}" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">${ctaLabel}</a></p>
    ${args.activateUrl ? `<p style="color:#262262;opacity:.7;font-size:13px">This activation link is valid for 7 days. If it expires, use “Forgot password” on the <a href="${base}/partners/sign-in" style="color:#E6007E">sign-in page</a>.</p>` : ""}
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `Welcome to the Logos RX partner program!\n\nHi ${greetingName},\n\n${org} has been approved as a Logos RX affiliate partner.\n\n${ctaLabel}: ${ctaUrl}\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: "Your Logos RX partner account is approved",
    html,
    text,
  });
}

/** Invitation email sent to a rep created by their partner org. */
export async function sendRepInviteEmail(args: {
  to: string;
  repName: string;
  orgName: string;
  activateUrl?: string;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.repName?.trim() || "there";
  const org = args.orgName?.trim() || "your organization";
  const ctaUrl = args.activateUrl ?? `${base}/partners/sign-in`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">You've been invited to the Logos RX partner portal</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p><strong>${escapeHtml(org)}</strong> has added you as a sales rep on the Logos RX affiliate program. Activate your account to get your personal referral links and track your clinic sign-ups and commissions.</p>
    <p><a href="${ctaUrl}" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">Activate your account</a></p>
    <p style="color:#262262;opacity:.7;font-size:13px">This activation link is valid for 7 days. If it expires, ask ${escapeHtml(org)} to re-send your invite, or use “Forgot password” on the <a href="${base}/partners/sign-in" style="color:#E6007E">sign-in page</a>.</p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `You've been invited to the Logos RX partner portal\n\nHi ${greetingName},\n\n${org} has added you as a sales rep on the Logos RX affiliate program.\n\nActivate your account: ${ctaUrl}\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: `${org} invited you to the Logos RX partner program`,
    html,
    text,
  });
}

/** Invitation email sent when an org owner/admin adds a teammate. */
export async function sendOrgMemberInviteEmail(args: {
  to: string;
  name: string;
  orgName: string;
  role: string;
  activateUrl?: string;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.name?.trim() || "there";
  const org = args.orgName?.trim() || "your organization";
  const ctaUrl = args.activateUrl ?? `${base}/partners/sign-in`;
  const roleLabel = args.role === "admin" ? "an admin" : "a viewer";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">You've been added to the Logos RX partner portal</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p><strong>${escapeHtml(org)}</strong> has added you as ${roleLabel} on their Logos RX partner account. Activate your account to access the partner portal.</p>
    <p><a href="${ctaUrl}" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">Activate your account</a></p>
    <p style="color:#262262;opacity:.7;font-size:13px">This activation link is valid for 7 days. If it expires, ask ${escapeHtml(org)} to re-send your invite, or use “Forgot password” on the <a href="${base}/partners/sign-in" style="color:#E6007E">sign-in page</a>.</p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `You've been added to the Logos RX partner portal\n\nHi ${greetingName},\n\n${org} has added you as ${roleLabel} on their Logos RX partner account.\n\nActivate your account: ${ctaUrl}\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: `${org} added you to their Logos RX partner account`,
    html,
    text,
  });
}

/** Confirmation email sent when an admin records a commission payout. */
export async function sendPayoutRecordedEmail(args: {
  to: string;
  name: string;
  amountLabel: string;
  method?: string | null;
  reference?: string | null;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.name?.trim() || "there";
  const detail = [
    args.method ? `Method: ${escapeHtml(args.method)}` : null,
    args.reference ? `Reference: ${escapeHtml(args.reference)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">Commission payout sent</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p>A commission payout of <strong>${escapeHtml(args.amountLabel)}</strong> has been recorded for you on the Logos RX partner program.</p>
    ${detail ? `<p style="color:#262262;opacity:.8;font-size:14px">${detail}</p>` : ""}
    <p><a href="${base}/partners/payouts" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">View in your portal</a></p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `Commission payout sent\n\nHi ${greetingName},\n\nA commission payout of ${args.amountLabel} has been recorded for you on the Logos RX partner program.${detail ? `\n${detail.replace(/ · /g, "\n")}` : ""}\n\nView in your portal: ${base}/partners/payouts\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: `Your Logos RX commission payout: ${args.amountLabel}`,
    html,
    text,
  });
}

/**
 * Confirmation sent to a partner (org owner or rep) right after they execute
 * the Marketing Services Agreement. Points them to their portal, where the
 * fully executed copy is available to view/print at any time.
 */
export async function sendPartnerMsaSignedEmail(args: {
  to: string;
  signerName: string;
  orgName: string;
}): Promise<boolean> {
  const base = SITE_URL;
  const greetingName = args.signerName?.trim() || "there";
  const org = args.orgName?.trim() || "your organization";
  const url = `${base}/partners/agreement`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:20px;color:#262262">Your Marketing Services Agreement is signed</h1>
    <p>Hi ${escapeHtml(greetingName)},</p>
    <p>Thanks — your Marketing Services Agreement with Logos RX${args.orgName ? ` for <strong>${escapeHtml(org)}</strong>` : ""} has been signed and recorded. A copy is kept on file for both you and the pharmacy.</p>
    <p>You can view or print your executed copy any time from your partner portal:</p>
    <p><a href="${url}" style="display:inline-block;background:#E6007E;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">View your signed agreement</a></p>
    <p style="color:#262262;opacity:.7;font-size:13px">If you didn't sign this, contact us immediately by replying to this email.</p>
    <p style="color:#262262;opacity:.7;font-size:13px">— The Logos RX Team</p>
  </div>`;

  const text = `Your Marketing Services Agreement is signed\n\nHi ${greetingName},\n\nYour Marketing Services Agreement with Logos RX${args.orgName ? ` for ${org}` : ""} has been signed and recorded. A copy is kept on file for both you and the pharmacy.\n\nView or print your executed copy: ${url}\n\nIf you didn't sign this, contact us immediately.\n\n— The Logos RX Team`;

  return sendEmail({
    to: args.to,
    subject: "Your Logos RX Marketing Services Agreement is signed",
    html,
    text,
  });
}

/**
 * Internal notification to the pharmacy that a partner executed their MSA, so
 * the pharmacy keeps its own record of the event. Links to the admin partner
 * detail page where the executed copy can be reviewed/downloaded.
 */
export async function sendPharmacyMsaSignedNotification(args: {
  orgName: string;
  signerName: string;
  signerTitle: string;
  signerKind: "org" | "rep";
  orgId: number;
}): Promise<boolean> {
  const base = SITE_URL;
  const url = `${base}/admin/partners/${args.orgId}`;
  const who = args.signerKind === "org" ? "organization owner" : "rep";

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#262262">
    <h1 style="font-size:18px;color:#262262">Partner MSA signed</h1>
    <p><strong>${escapeHtml(args.orgName)}</strong> — the ${who} <strong>${escapeHtml(args.signerName)}</strong>${args.signerTitle ? ` (${escapeHtml(args.signerTitle)})` : ""} has executed the Marketing Services Agreement.</p>
    <p><a href="${url}" style="display:inline-block;background:#262262;color:#fff;text-decoration:none;padding:10px 18px;border-radius:9999px;font-weight:600">Review in admin</a></p>
  </div>`;

  const text = `Partner MSA signed\n\n${args.orgName} — the ${who} ${args.signerName}${args.signerTitle ? ` (${args.signerTitle})` : ""} has executed the Marketing Services Agreement.\n\nReview in admin: ${url}`;

  return sendEmail({
    to: CONTACT.email,
    subject: `Partner MSA signed — ${args.orgName}`,
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
