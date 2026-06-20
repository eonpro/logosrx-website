import "server-only";
import { SITE_URL } from "@/lib/constants";
import { log } from "@/lib/observability/logger";

/**
 * Minimal Slack notifier built on an Incoming Webhook.
 *
 * Set `SLACK_WEBHOOK_URL` (Slack → Apps → Incoming Webhooks) in the environment.
 * When it's unset the helper no-ops with a single warning so the surrounding
 * flow (e.g. clinic signup) never fails because of a notification problem.
 */

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackField {
  label: string;
  value: string;
}

/** Posts a header + key/value fields + optional action link to Slack. */
async function postToSlack(args: {
  header: string;
  fields: SlackField[];
  contextLink?: { text: string; url: string };
}): Promise<void> {
  if (!WEBHOOK_URL) {
    log.warn("slack notify skipped: SLACK_WEBHOOK_URL not set");
    return;
  }

  const fieldText = args.fields
    .filter((f) => f.value)
    .map((f) => `*${f.label}:*\n${f.value}`);

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: args.header, emoji: true },
    },
  ];

  // Slack section "fields" render in a two-column grid, max 10 per section.
  for (let i = 0; i < fieldText.length; i += 10) {
    blocks.push({
      type: "section",
      fields: fieldText.slice(i, i + 10).map((text) => ({
        type: "mrkdwn",
        text,
      })),
    });
  }

  if (args.contextLink) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${args.contextLink.url}|${args.contextLink.text}>`,
      },
    });
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: args.header, blocks }),
    });
    if (!res.ok) {
      log.warn("slack notify failed", { status: res.status });
    }
  } catch (err) {
    log.warn("slack notify threw", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export interface NewClinicNotification {
  clinicName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  practiceType: string;
  products: string[];
  orderVolume: string;
  providerCount: number;
  state: string;
}

const VOLUME_LABELS: Record<string, string> = {
  "0_5000": "$0–$5k/mo",
  "5000_15000": "$5k–$15k/mo",
  "15000_50000": "$15k–$50k/mo",
  "50000_plus": "$50k+/mo",
};

/** Posts to Slack when an admin approves (verifies) a clinic. */
export async function notifyClinicApproved(args: {
  clinicName: string;
  contactEmail: string;
  approvedBy: string;
}): Promise<void> {
  await postToSlack({
    header: "✅ Clinic approved",
    fields: [
      { label: "Clinic", value: args.clinicName || "—" },
      { label: "Contact", value: args.contactEmail || "—" },
      { label: "Approved by", value: args.approvedBy || "—" },
    ],
  });
}

/** Notifies admins that a new affiliate partner application came in. */
export async function notifyNewPartnerApplication(args: {
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}): Promise<void> {
  const base = SITE_URL;
  await postToSlack({
    header: "🤝 New partner application",
    fields: [
      { label: "Organization", value: args.orgName || "—" },
      { label: "Contact", value: args.contactName || "—" },
      { label: "Email", value: args.contactEmail || "—" },
      { label: "Phone", value: args.contactPhone || "—" },
      { label: "Website", value: args.website || "—" },
    ],
    contextLink: {
      text: "Review in admin →",
      url: `${base}/admin/partners`,
    },
  });
}

/** Notifies admins that a clinic finished onboarding and needs verification. */
export async function notifyNewClinic(
  n: NewClinicNotification,
): Promise<void> {
  const base = SITE_URL;
  await postToSlack({
    header: "🏥 New clinic awaiting verification",
    fields: [
      { label: "Clinic", value: n.clinicName || "—" },
      { label: "Contact", value: n.contactName || "—" },
      { label: "Email", value: n.contactEmail || "—" },
      { label: "Phone", value: n.contactPhone || "—" },
      { label: "Practice type", value: n.practiceType || "—" },
      { label: "State", value: n.state || "—" },
      {
        label: "Products",
        value: n.products.length ? n.products.join(", ") : "—",
      },
      {
        label: "Order volume",
        value: VOLUME_LABELS[n.orderVolume] ?? n.orderVolume ?? "—",
      },
      { label: "Providers", value: String(n.providerCount) },
    ],
    contextLink: {
      text: "Review in admin →",
      url: `${base}/admin/clinics`,
    },
  });
}
