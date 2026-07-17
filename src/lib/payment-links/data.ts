import "server-only";
import { randomInt } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardUpdateLinks,
  clinicPayments,
  clinics,
  type CardUpdateLink,
} from "@/lib/db/schema";

/**
 * Data helpers for shareable card-update links (`/update-card/<token>`):
 * admin-generated, single-use links a clinic opens to re-enter their full
 * payment card without signing in. The unguessable token is the credential.
 */

// Unambiguous alphabet (no 0/O/1/I/L) — same convention as quote tokens.
const TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Generates an unguessable, URL-safe link token (~24 chars, base32-ish). */
export function generateCardUpdateToken(length = 24): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  }
  return out;
}

export function isCardLinkExpired(link: CardUpdateLink): boolean {
  return Boolean(link.expiresAt && link.expiresAt.getTime() < Date.now());
}

/** True when a link can still be opened/submitted by the clinic. */
export function isCardLinkOpenable(link: CardUpdateLink): boolean {
  return link.status === "active" && !isCardLinkExpired(link);
}

export interface CardLinkWithClinic {
  link: CardUpdateLink;
  clinic: {
    id: number;
    clerkUserId: string;
    clinicName: string | null;
    practiceLegalName: string | null;
    contactName: string | null;
  };
}

/** Loads a card-update link and its clinic by public token. */
export async function getCardUpdateLinkByToken(
  token: string,
): Promise<CardLinkWithClinic | null> {
  const clean = token.trim().toLowerCase();
  if (!clean) return null;
  const [row] = await db
    .select({
      link: cardUpdateLinks,
      clinic: {
        id: clinics.id,
        clerkUserId: clinics.clerkUserId,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        contactName: clinics.contactName,
      },
    })
    .from(cardUpdateLinks)
    .innerJoin(clinics, eq(clinics.id, cardUpdateLinks.clinicId))
    .where(eq(cardUpdateLinks.token, clean))
    .limit(1);
  return row ?? null;
}

/** Latest link for a clinic (any status) — for the admin clinic detail view. */
export async function getLatestCardUpdateLink(
  clinicId: number,
): Promise<CardUpdateLink | null> {
  const [row] = await db
    .select()
    .from(cardUpdateLinks)
    .where(eq(cardUpdateLinks.clinicId, clinicId))
    .orderBy(desc(cardUpdateLinks.createdAt))
    .limit(1);
  return row ?? null;
}

export interface CardUpdateLinkSummary {
  link: CardUpdateLink;
  clinic: {
    id: number;
    clinicName: string | null;
    practiceLegalName: string | null;
    contactEmail: string | null;
  };
  /** Last 4 of the card currently on file (post-submission this is the new card). */
  cardLast4: string | null;
}

/** All card-update links across clinics, newest first — the admin index. */
export async function listCardUpdateLinks(): Promise<CardUpdateLinkSummary[]> {
  const rows = await db
    .select({
      link: cardUpdateLinks,
      clinic: {
        id: clinics.id,
        clinicName: clinics.clinicName,
        practiceLegalName: clinics.practiceLegalName,
        contactEmail: clinics.contactEmail,
      },
      cardLast4: clinicPayments.cardLast4,
    })
    .from(cardUpdateLinks)
    .innerJoin(clinics, eq(clinics.id, cardUpdateLinks.clinicId))
    .leftJoin(
      clinicPayments,
      eq(clinicPayments.clerkUserId, clinics.clerkUserId),
    )
    .orderBy(desc(cardUpdateLinks.createdAt));
  return rows;
}

export interface ClinicOption {
  id: number;
  name: string;
}

/** Completed clinics for the "generate a link" picker, alphabetized. */
export async function listClinicOptions(): Promise<ClinicOption[]> {
  const rows = await db
    .select({
      id: clinics.id,
      clinicName: clinics.clinicName,
      practiceLegalName: clinics.practiceLegalName,
      contactEmail: clinics.contactEmail,
    })
    .from(clinics)
    .where(eq(clinics.onboardingCompleted, true));
  return rows
    .map((c) => ({
      id: c.id,
      name:
        c.clinicName?.trim() ||
        c.practiceLegalName?.trim() ||
        c.contactEmail ||
        `Clinic #${c.id}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
