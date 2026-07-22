import type { Order } from "@/lib/db/schema";
import type { BadgeTone } from "@/components/ui/portal";

/**
 * Clinic-facing labels for the internal order lifecycle. "Needs attention"
 * states are worded so the clinic knows our team is on it — the raw pharmacy
 * error never surfaces here.
 */
export const ORDER_STATUS_UI: Record<
  Order["status"],
  { label: string; tone: BadgeTone; description: string }
> = {
  submitted: {
    label: "Processing",
    tone: "neutral",
    description: "Your order is being transmitted to the pharmacy.",
  },
  accepted: {
    label: "Sent to pharmacy",
    tone: "success",
    description: "The pharmacy received this order and is processing it.",
  },
  pharmacy_rejected: {
    label: "Needs attention",
    tone: "danger",
    description:
      "The pharmacy could not accept this order. Our team has been notified and will reach out.",
  },
  failed: {
    label: "Needs attention",
    tone: "warning",
    description:
      "The order could not reach the pharmacy. Our team has been notified and will follow up.",
  },
};
