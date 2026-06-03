import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { log } from "@/lib/observability/logger";

/**
 * Transactional email sender built on AWS SES (v2).
 *
 * SES lives in a different AWS account than the app's Vercel OIDC role (which is
 * scoped to RDS), so we authenticate with a dedicated, send-only IAM access key
 * rather than the OIDC role.
 *
 * Configure:
 *   - `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`  (IAM user with ses:SendEmail)
 *   - `SES_REGION`  (defaults to us-east-1)
 *   - `EMAIL_FROM`  (e.g. "Logos RX <noreply@logosrx.com>"; the address/domain
 *                    must be a verified SES identity)
 *
 * When the SES credentials aren't configured the helper no-ops with a single
 * warning so the surrounding flow (e.g. clinic approval) never fails because
 * email isn't wired up yet.
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

export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  if (!args.to) return false;
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
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.logosrx.com";
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
