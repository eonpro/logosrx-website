export type NewsGroup = "newsroom" | "education";

export const NEWSROOM_CATEGORIES = [
  "Leadership",
  "Company News",
  "Product",
  "Partnerships",
] as const;

export const EDUCATION_CATEGORIES = [
  "Vitality",
  "Weight Management",
  "Hormones",
  "Peptide Therapy",
  "Anti-Aging",
  "Custom Compound",
  "Men's Health",
  "Patient Education",
] as const;

export type NewsroomCategory = (typeof NEWSROOM_CATEGORIES)[number];
export type EducationCategory = (typeof EDUCATION_CATEGORIES)[number];
export type NewsCategory = NewsroomCategory | EducationCategory;

export interface NewsArticle {
  title: string;
  slug: string;
  group: NewsGroup;
  category: NewsCategory;
  excerpt: string;
  date: string;
  author?: string;
  heroImage?: string;
  heroCaption?: string;
  content: string[];
  featured?: boolean;
}
