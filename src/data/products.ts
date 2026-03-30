export interface ProductDetail {
  label: string;
  content: string;
}

export interface Product {
  name: string;
  slug: string;
  category: string;
  description: string;
  badge?: string;
  sku?: string;
  image: string;
  concentration: string;
  form: string;
  size: string;
  activeIngredient: {
    name: string;
    description: string;
  };
  details: ProductDetail[];
}

export const categories = [
  "All Products",
  "IV Therapy & Supplements",
  "Peptide Therapy",
  "Vitality",
  "Custom Compound",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    name: "Glutathione",
    slug: "glutathione",
    category: "IV Therapy & Supplements",
    description:
      "A powerful intracellular antioxidant present in almost every human cell, Glutathione plays a crucial role in neutralizing oxidative stress, strengthening immune defense, aiding liver detoxification, and regulating inflammatory processes to promote overall cellular health and resilience.",
    image: "/images/products/glutathione-vial.webp",
    concentration: "200mg/mL",
    form: "Injectable",
    size: "10mL",
    activeIngredient: {
      name: "L-Glutathione (Reduced)",
      description:
        "The biologically active, antioxidant form of glutathione—a tripeptide derived from amino acids that safeguards cells against oxidative damage, neutralizes toxins, and supports overall cellular repair and detoxification.",
    },
    details: [
      { label: "How to Use", content: "Administer as directed by your healthcare provider. For intramuscular or intravenous use only." },
      { label: "Size", content: "10mL vial" },
      { label: "Concentration", content: "200mg/mL" },
      { label: "Schedule", content: "As prescribed by your healthcare provider" },
      { label: "BUD", content: "Please refer to the vial label for the beyond-use date." },
    ],
  },
  {
    name: "NAD+",
    slug: "nad",
    category: "IV Therapy & Supplements",
    description:
      "NAD+ is an essential molecule that fuels cellular energy, metabolism, and repair mechanisms. Since its natural levels drop over time, replenishing NAD+ may help restore vitality, promote longevity, and strengthen the body's ability to repair and renew itself.",
    badge: "Very Popular",
    sku: "364215376135191",
    image: "/images/products/nad-vial.webp",
    concentration: "100mg/mL",
    form: "Injectable",
    size: "10mL",
    activeIngredient: {
      name: "Nicotinamide Adenine Dinucleotide (NAD+)",
      description:
        "A critical coenzyme found in every living cell, NAD+ plays a key role in metabolic activity—most notably in generating cellular energy and facilitating electron transport throughout redox reactions.",
    },
    details: [
      { label: "How to Use", content: "Administer as directed by your healthcare provider. For intravenous use only." },
      { label: "Size", content: "10mL vial" },
      { label: "Concentration", content: "100mg/mL" },
      { label: "Schedule", content: "As prescribed by your healthcare provider" },
      { label: "BUD", content: "Please refer to the vial label for the beyond-use date." },
    ],
  },
  {
    name: "Sermorelin",
    slug: "sermorelin",
    category: "Peptide Therapy",
    description:
      "A bioidentical peptide that mimics the natural growth hormone–releasing hormone (GHRH), Sermorelin works by stimulating the pituitary gland to produce and secrete growth hormone in alignment with the body's natural circadian rhythm. This helps promote balanced growth hormone levels and supports overall metabolic and restorative functions.",
    image: "/images/products/sermorelin-vial.webp",
    concentration: "6mg/mL",
    form: "Injectable",
    size: "5mL",
    activeIngredient: {
      name: "Sermorelin Acetate",
      description:
        "A synthetic analog of the body's natural Growth Hormone–Releasing Hormone (GHRH), designed to stimulate the pituitary gland to increase the natural production and secretion of growth hormone.",
    },
    details: [
      { label: "How to Use", content: "Administer subcutaneously as directed by your healthcare provider." },
      { label: "Size", content: "5mL multi-dose vial" },
      { label: "Concentration", content: "6mg/mL or 9mg/mL" },
      { label: "Schedule", content: "As prescribed by your healthcare provider" },
      { label: "BUD", content: "Please refer to the vial label for the beyond-use date." },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(currentSlug: string): Product[] {
  return products.filter((p) => p.slug !== currentSlug);
}

export function getProductsByCategory(category: Category): Product[] {
  if (category === "All Products") return products;
  return products.filter((p) => p.category === category);
}
