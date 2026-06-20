/**
 * Team roster for the /about page and for `reviewedBy`/`author` E-E-A-T schema.
 *
 * ⚠️ STAKEHOLDER-SUPPLIED ONLY. This array is intentionally EMPTY. Do not invent
 * pharmacist names, titles, or credentials — fabricated people are a Google
 * E-E-A-T penalty and an AI-trust poison, and for a YMYL pharmacy they're a
 * compliance risk. When real, verifiable staff are provided, add them here and
 * the /about page renders bios automatically; a named pharmacist should also be
 * set as `REVIEWER` in `knowledge.ts` to unlock `reviewedBy` on medical pages.
 */

export interface TeamMember {
  name: string;
  /** e.g. "PharmD", "RPh" — honorific suffix used in Person schema. */
  credential?: string;
  role: string;
  bio: string;
  /** Optional /public path to a headshot. */
  image?: string;
  /** Optional license/registry URL for verification (sameAs). */
  profileUrl?: string;
}

export const teamMembers: TeamMember[] = [];
