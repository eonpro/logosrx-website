import { SPECIALTY_OPTIONS } from "@/lib/onboarding/steps";

/**
 * Best-effort map from NPPES taxonomy description → our specialty slugs.
 * Unmatched taxonomies return null so the UI can leave the field alone.
 */
const TAXONOMY_TO_SPECIALTY: Array<{ match: RegExp; value: string }> = [
  { match: /dermatolog/i, value: "dermatology" },
  { match: /endocrin/i, value: "endocrinology" },
  { match: /urolog/i, value: "urology" },
  { match: /obstetric|gynecolog|ob\/?gyn/i, value: "obgyn" },
  { match: /pain\s*manag|pain\s*medicine|interventional\s*pain/i, value: "pain_management" },
  { match: /anti.?aging|regenerative|wellness/i, value: "anti_aging" },
  { match: /functional\s*medicine|integrative/i, value: "functional_medicine" },
  { match: /veterinar/i, value: "veterinary" },
  {
    match:
      /family\s*medicine|internal\s*medicine|general\s*practice|primary\s*care|hospitalist|pediatric|nurse\s*practitioner|physician\s*assistant/i,
    value: "primary_care",
  },
];

const VALID = new Set(SPECIALTY_OPTIONS.map((o) => o.value));

export function mapTaxonomyToSpecialty(
  description: string | undefined | null,
): string | null {
  if (!description?.trim()) return null;
  for (const { match, value } of TAXONOMY_TO_SPECIALTY) {
    if (match.test(description) && VALID.has(value)) return value;
  }
  return null;
}
