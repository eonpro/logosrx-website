import type { NewsArticle } from "./types";

/**
 * File-based newsroom registry. Add a post here, open a PR, deploy.
 * Public URLs: news.logosrx.com/newsroom/<slug>
 */
export const newsArticles: NewsArticle[] = [
  {
    title: "Logos RX Expands Sterile Compounding Capacity in Tampa",
    slug: "logos-rx-expands-sterile-compounding-capacity-tampa",
    group: "newsroom",
    category: "Company News",
    excerpt:
      "Our Tampa facility is expanding sterile compounding capacity to better serve providers across our licensed states with consistent, tested formulations.",
    date: "2026-07-15",
    author: "Logos RX Team",
    heroImage: "/images/facility-tampa.png",
    heroCaption: "Logos RX compounding facility in Tampa, Florida.",
    featured: true,
    content: [
      "Logos RX is expanding sterile compounding capacity at our Tampa headquarters to meet growing demand from licensed providers who rely on personalized medications for their patients.",
      "The expansion strengthens our ability to prepare sterile injectables under USP 797 standards, with third-party potency and sterility testing on every batch we release.",
      "Providers across our multi-state footprint can expect the same pharmacist consultation, formulation flexibility, and quality controls — now with greater throughput for high-demand therapies including peptides, hormone therapies, and metabolic support compounds.",
      "If your clinic is already prescribing with Logos RX, no action is required. New providers can begin the intake process at logosrx.com/onboarding.",
    ],
  },
  {
    title: "A Safer Pathway for Peptide Access: What Providers Should Know",
    slug: "safer-pathway-for-peptide-access-providers",
    group: "newsroom",
    category: "Leadership",
    excerpt:
      "Regulatory clarity around peptide compounding continues to evolve. Here is how Logos RX approaches quality, documentation, and clinical partnership.",
    date: "2026-06-20",
    author: "Logos RX Clinical Team",
    heroImage: "/images/building-trust-bg.webp",
    heroCaption: "Quality and transparency remain central to every compounded peptide we prepare.",
    content: [
      "Peptide therapy has become a meaningful part of many longevity, recovery, and metabolic care protocols. As FDA and compounding frameworks continue to evolve, clinics need a pharmacy partner that prioritizes documentation, testing, and clear communication.",
      "At Logos RX, every sterile peptide formulation is prepared under USP 797 controls. We maintain batch records, beyond-use dating grounded in stability considerations, and third-party testing for potency and sterility.",
      "We work directly with licensed providers — not consumers — so each compound starts from a valid patient-specific prescription. Our pharmacists are available to consult on concentration, diluent, and dosing presentation when commercial options do not fit the clinical plan.",
      "As guidance updates, we will continue to share practical notes for clinics through this newsroom. For formulation questions today, contact our pharmacy team at support@logosrx.com.",
    ],
  },
  {
    title: "Partnering with Clinics for Personalized Metabolic Care",
    slug: "partnering-with-clinics-personalized-metabolic-care",
    group: "newsroom",
    category: "Partnerships",
    excerpt:
      "Logos RX works alongside clinics that need flexible GLP-1 and supportive compound options tailored to individual patients.",
    date: "2026-05-28",
    author: "Logos RX Team",
    heroImage: "/images/trusted-providers.webp",
    heroCaption: "Providers trust Logos RX for personalized compounding support.",
    content: [
      "Metabolic care programs succeed when medication access, education, and follow-up work together. Logos RX partners with clinics that need compounding flexibility — from concentration adjustments to adjunct supportive therapies — without compromising quality.",
      "Our pharmacists consult with providers on formulation options, storage guidance for patients, and practical considerations for titration schedules that commercial products may not accommodate.",
      "Clinic partners also receive catalog access, account support, and clear communication when supply or regulatory conditions change. The goal is simple: reliable compounds so clinicians can focus on patient outcomes.",
      "Interested in partnering? Start provider onboarding at logosrx.com/onboarding or reach our team at support@logosrx.com.",
    ],
  },
  {
    title: "Understanding NAD+: Your Guide to Cellular Vitality",
    slug: "understanding-nad-cellular-vitality",
    group: "education",
    category: "Vitality",
    excerpt:
      "NAD+ is a critical coenzyme found in every living cell. Learn how replenishing NAD+ levels can restore energy, support brain function, and promote healthy aging.",
    date: "2026-03-10",
    author: "Logos RX Education",
    heroImage: "/images/products/nad-plus.webp",
    heroCaption: "Compounded NAD+ prepared for provider-directed therapy.",
    content: [
      "Nicotinamide adenine dinucleotide (NAD+) is one of the most important molecules in the human body. Found in every living cell, it plays a central role in energy metabolism, DNA repair, and cellular signaling. Without adequate NAD+, our cells simply cannot function at their best.",
      "As we age, NAD+ levels naturally decline — sometimes by as much as 50% between the ages of 40 and 60. This decline has been linked to fatigue, cognitive fog, weakened immune response, and accelerated aging at the cellular level. Researchers believe that restoring NAD+ levels may help slow or even reverse some of these age-related changes.",
      "NAD+ works primarily through two mechanisms. First, it serves as a coenzyme in redox reactions, helping convert nutrients into ATP — the energy currency of cells. Second, it activates sirtuins, a family of proteins that regulate inflammation, stress resistance, and longevity pathways.",
      "Compounded NAD+ is available in injectable form, allowing for direct bioavailability that bypasses the digestive system. This is particularly important because oral NAD+ supplements are largely broken down before reaching cells. Injectable NAD+ delivers the molecule directly into the bloodstream for maximum therapeutic effect.",
      "Common clinical applications include anti-aging protocols, chronic fatigue management, neurodegenerative support, addiction recovery, and athletic performance optimization. Many providers report that patients experience improved mental clarity, sustained energy, and better sleep within the first few weeks of therapy.",
      "At Logos RX, our compounded NAD+ formulations are prepared in our sterile compounding labs under strict USP 797 guidelines. Each batch undergoes third-party potency and sterility testing to ensure consistent quality and safety for every patient.",
    ],
  },
  {
    title: "Exploring GLP-1: The Science Behind Weight Management",
    slug: "exploring-glp1-weight-management",
    group: "education",
    category: "Weight Management",
    excerpt:
      "GLP-1 receptor agonists have transformed weight management. Discover how these medications work, who they're for, and what providers should know.",
    date: "2026-03-05",
    author: "Logos RX Education",
    heroImage: "/images/products/semaglutide-5mg.webp",
    heroCaption: "GLP-1 formulations support provider-directed metabolic care.",
    content: [
      "Glucagon-like peptide-1 (GLP-1) receptor agonists have emerged as one of the most significant advances in weight management in decades. Originally developed for type 2 diabetes, these medications have shown remarkable efficacy in helping patients achieve sustainable weight loss.",
      "GLP-1 is a naturally occurring hormone produced in the gut after eating. It signals the brain to reduce appetite, slows gastric emptying, and enhances insulin secretion. GLP-1 receptor agonists mimic this hormone, amplifying its effects for therapeutic benefit.",
      "Medications like semaglutide and tirzepatide work by binding to GLP-1 receptors in the hypothalamus, the brain region that controls hunger and satiety. Clinical trials have demonstrated average weight loss of 15-20% of body weight over 68 weeks — results previously achievable only through bariatric surgery.",
      "For compounding pharmacies, GLP-1 medications represent an opportunity to provide personalized formulations. Compounded versions can be tailored to individual dosing schedules, combined with supportive nutrients like B12, and prepared in patient-friendly concentrations that commercial products may not offer.",
      "Providers considering GLP-1 therapy for their patients should be aware of common side effects including nausea, constipation, and reduced appetite — which are typically dose-dependent and improve over time. Gradual dose titration is key to patient compliance and comfort.",
      "At Logos RX, we compound GLP-1 formulations under rigorous quality controls. Our pharmacists work directly with providers to customize concentrations and dosing protocols that align with each patient's unique treatment plan.",
    ],
  },
  {
    title: "Sermorelin: Benefits of Growth Hormone Peptide Therapy",
    slug: "sermorelin-growth-hormone-peptide-therapy",
    group: "education",
    category: "Peptide Therapy",
    excerpt:
      "Sermorelin stimulates natural growth hormone production. Learn how this peptide therapy supports anti-aging, recovery, and metabolic health.",
    date: "2026-02-20",
    author: "Logos RX Education",
    heroImage: "/images/products/sermorelin.webp",
    heroCaption: "Compounded sermorelin for individualized peptide protocols.",
    content: [
      "Sermorelin acetate is a bioidentical peptide analog of growth hormone-releasing hormone (GHRH). Unlike synthetic growth hormone, which directly introduces HGH into the body, sermorelin works by stimulating the pituitary gland to produce and release growth hormone naturally, following the body's own circadian rhythm.",
      "This approach offers several advantages. Because sermorelin triggers the body's natural production pathways, it maintains the physiological pulsatile pattern of growth hormone release. This reduces the risk of side effects associated with exogenous HGH and allows for more natural regulation through feedback loops.",
      "Clinical benefits of sermorelin therapy include improved body composition (increased lean muscle, decreased body fat), enhanced sleep quality, faster recovery from exercise and injury, improved skin elasticity, and better cognitive function. Many patients report feeling more energetic and mentally sharp within 4-6 weeks of starting therapy.",
      "Sermorelin is particularly popular in anti-aging and regenerative medicine practices. It offers a legal, accessible, and cost-effective alternative to growth hormone therapy with a favorable safety profile for long-term use.",
      "Dosing is typically administered via subcutaneous injection before bedtime, as this aligns with the body's natural peak in growth hormone production during deep sleep. Providers should monitor IGF-1 levels to assess response and adjust dosing accordingly.",
      "At Logos RX, our compounded sermorelin is available in multiple concentrations (6mg/mL and 9mg/mL) to accommodate different dosing protocols. Each vial is prepared under sterile conditions and tested for potency and sterility before release.",
    ],
  },
];
