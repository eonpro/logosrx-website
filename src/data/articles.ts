export interface Article {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string[];
  date: string;
}

export const articleCategories = [
  "All",
  "Vitality",
  "Weight Management",
  "Hormones",
  "Peptide Therapy",
  "Anti-Aging",
  "Custom Compound",
  "Men's Health",
  "Patient Education",
] as const;

export type ArticleCategory = (typeof articleCategories)[number];

export const articles: Article[] = [
  {
    title: "Understanding NAD+: Your Guide to Cellular Vitality",
    slug: "understanding-nad-cellular-vitality",
    category: "Vitality",
    excerpt:
      "NAD+ is a critical coenzyme found in every living cell. Learn how replenishing NAD+ levels can restore energy, support brain function, and promote healthy aging.",
    date: "2026-03-10",
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
    category: "Weight Management",
    excerpt:
      "GLP-1 receptor agonists have transformed weight management. Discover how these medications work, who they're for, and what providers should know.",
    date: "2026-03-05",
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
    title: "A Guide to Hormone Replacement Therapy",
    slug: "guide-hormone-replacement-therapy",
    category: "Hormones",
    excerpt:
      "Hormone replacement therapy can be life-changing for patients experiencing hormonal imbalance. Here's what providers and patients should know.",
    date: "2026-02-28",
    content: [
      "Hormone replacement therapy (HRT) is a medical treatment designed to supplement or replace hormones that the body is no longer producing in adequate quantities. It is most commonly associated with menopause in women and andropause in men, but its applications extend to thyroid disorders, adrenal insufficiency, and more.",
      "For women, declining estrogen and progesterone levels during menopause can cause hot flashes, night sweats, mood changes, vaginal dryness, and bone density loss. Bioidentical hormone replacement therapy (BHRT) uses hormones that are molecularly identical to those produced by the human body, offering a more natural approach compared to synthetic alternatives.",
      "Men experiencing low testosterone may notice fatigue, decreased muscle mass, reduced libido, cognitive changes, and increased body fat. Testosterone replacement therapy — available in injectable, topical, and pellet forms — can help restore optimal levels and improve quality of life.",
      "Compounding pharmacies play a critical role in HRT because they can customize formulations that commercial products cannot match. This includes adjusting doses to precise levels based on lab work, combining multiple hormones into a single preparation, and creating alternative delivery methods for patients who cannot tolerate standard options.",
      "Monitoring is essential in any HRT protocol. Providers should order baseline labs, follow up with regular blood work, and adjust dosages based on both lab values and symptom resolution. The goal is to achieve physiological hormone levels — not supraphysiological — for safe, long-term therapy.",
      "Logos RX specializes in compounded bioidentical hormones including estradiol, progesterone, testosterone, DHEA, and thyroid preparations. All formulations are prepared in our state-of-the-art labs with rigorous quality assurance at every step.",
    ],
  },
  {
    title: "Sermorelin: Benefits of Growth Hormone Peptide Therapy",
    slug: "sermorelin-growth-hormone-peptide-therapy",
    category: "Peptide Therapy",
    excerpt:
      "Sermorelin stimulates natural growth hormone production. Learn how this peptide therapy supports anti-aging, recovery, and metabolic health.",
    date: "2026-02-20",
    content: [
      "Sermorelin acetate is a bioidentical peptide analog of growth hormone-releasing hormone (GHRH). Unlike synthetic growth hormone, which directly introduces HGH into the body, sermorelin works by stimulating the pituitary gland to produce and release growth hormone naturally, following the body's own circadian rhythm.",
      "This approach offers several advantages. Because sermorelin triggers the body's natural production pathways, it maintains the physiological pulsatile pattern of growth hormone release. This reduces the risk of side effects associated with exogenous HGH and allows for more natural regulation through feedback loops.",
      "Clinical benefits of sermorelin therapy include improved body composition (increased lean muscle, decreased body fat), enhanced sleep quality, faster recovery from exercise and injury, improved skin elasticity, and better cognitive function. Many patients report feeling more energetic and mentally sharp within 4-6 weeks of starting therapy.",
      "Sermorelin is particularly popular in anti-aging and regenerative medicine practices. It offers a legal, accessible, and cost-effective alternative to growth hormone therapy with a favorable safety profile for long-term use.",
      "Dosing is typically administered via subcutaneous injection before bedtime, as this aligns with the body's natural peak in growth hormone production during deep sleep. Providers should monitor IGF-1 levels to assess response and adjust dosing accordingly.",
      "At Logos RX, our compounded sermorelin is available in multiple concentrations (6mg/mL and 9mg/mL) to accommodate different dosing protocols. Each vial is prepared under sterile conditions and tested for potency and sterility before release.",
    ],
  },
  {
    title: "What Is a Compounding Pharmacy?",
    slug: "what-is-compounding-pharmacy",
    category: "Custom Compound",
    excerpt:
      "Compounding pharmacies create personalized medications tailored to individual needs. Learn how they differ from traditional pharmacies and why they matter.",
    date: "2026-02-15",
    content: [
      "A compounding pharmacy is a specialized pharmacy that creates customized medications tailored to the specific needs of individual patients. Unlike traditional retail pharmacies that dispense commercially manufactured drugs in standard doses and forms, compounding pharmacies can adjust nearly every aspect of a medication — from strength and dosage form to flavor and inactive ingredients.",
      "The practice of compounding has been a cornerstone of pharmacy for centuries. Before the rise of mass pharmaceutical manufacturing in the mid-20th century, virtually all prescriptions were compounded by pharmacists. Today, compounding has experienced a renaissance as healthcare providers recognize the limitations of one-size-fits-all medications.",
      "There are two main types of compounding pharmacies. A 503A pharmacy compounds medications based on individual patient prescriptions from licensed providers. A 503B outsourcing facility compounds larger batches without patient-specific prescriptions for use by healthcare facilities. Logos RX operates as a 503A pharmacy, ensuring every formulation is tailored to a specific patient's needs.",
      "Common reasons providers turn to compounding include: patients who need doses not commercially available, patients with allergies to dyes, fillers, or preservatives in commercial products, pediatric patients who need liquid formulations of drugs only available as tablets, and patients who need combination therapies in a single preparation for improved compliance.",
      "Quality and safety are paramount in compounding. Reputable pharmacies like Logos RX follow United States Pharmacopeia (USP) chapters 795, 797, and 800, which govern non-sterile compounding, sterile compounding, and hazardous drug handling respectively. Third-party testing, staff training, and facility standards all contribute to safe, effective medications.",
      "If you're a healthcare provider interested in compounding for your patients, Logos RX makes it easy to get started. Our team of pharmacists is available to consult on formulations, discuss dosing strategies, and help you provide truly personalized care.",
    ],
  },
  {
    title: "Glutathione: The Master Antioxidant",
    slug: "glutathione-master-antioxidant",
    category: "Anti-Aging",
    excerpt:
      "Glutathione is the body's most powerful antioxidant. Discover its role in detoxification, immune support, and why injectable forms are superior.",
    date: "2026-02-10",
    content: [
      "Glutathione is a tripeptide composed of three amino acids — glutamine, cysteine, and glycine — and is often called the body's master antioxidant. Present in virtually every cell, it plays a critical role in neutralizing free radicals, supporting immune function, and facilitating detoxification in the liver.",
      "The body naturally produces glutathione, but levels decline with age, chronic stress, poor nutrition, environmental toxins, and illness. Low glutathione levels have been associated with a wide range of conditions including neurodegenerative diseases, liver disease, cardiovascular problems, chronic fatigue, and accelerated aging.",
      "While oral glutathione supplements are widely available, research suggests that they are poorly absorbed in the gastrointestinal tract. The molecule is broken down by digestive enzymes before it can reach cells in meaningful quantities. This is why many clinicians prefer injectable glutathione — it bypasses the gut entirely and delivers the active molecule directly into the bloodstream.",
      "Clinical applications for injectable glutathione span multiple specialties. In integrative medicine, it's used for detoxification protocols, immune support, and skin brightening. In neurology, it has shown promise in supporting patients with Parkinson's disease and other neurodegenerative conditions. Athletic performance practitioners use it to reduce oxidative stress and accelerate recovery.",
      "The typical dosing protocol involves intramuscular or intravenous administration 1-3 times per week, depending on clinical goals. Some providers combine glutathione with other nutrients like vitamin C or NAD+ for synergistic effects.",
      "Logos RX compounds glutathione at 200mg/mL in multi-dose vials, prepared under strict sterile conditions. Our formulations undergo rigorous testing to ensure potency, sterility, and stability throughout the beyond-use dating period.",
    ],
  },
  {
    title: "Understanding Low Testosterone: A Comprehensive Guide",
    slug: "understanding-low-testosterone",
    category: "Men's Health",
    excerpt:
      "Low testosterone affects millions of men. Learn about the symptoms, causes, diagnostic criteria, and modern treatment options available.",
    date: "2026-02-05",
    content: [
      "Low testosterone, clinically known as hypogonadism, is a condition in which the body does not produce enough testosterone — the primary male sex hormone. While testosterone naturally declines with age (approximately 1-2% per year after age 30), some men experience more significant drops that substantially impact their quality of life.",
      "Symptoms of low testosterone can be subtle and are often attributed to 'normal aging.' Common signs include persistent fatigue, decreased libido, erectile dysfunction, loss of muscle mass, increased body fat (especially around the midsection), mood changes including depression and irritability, difficulty concentrating, and decreased bone density.",
      "Diagnosis requires both clinical symptoms and laboratory confirmation. Most guidelines define low testosterone as a total testosterone level below 300 ng/dL, measured via morning blood draw (testosterone levels peak in the early morning). Providers should also assess free testosterone, SHBG, LH, FSH, and prolactin to determine the underlying cause.",
      "Treatment options for low testosterone include testosterone cypionate injections (the most common and cost-effective approach), topical gels and creams, subcutaneous pellets, and nasal preparations. The choice of delivery method depends on patient preference, insurance coverage, and clinical factors.",
      "Compounded testosterone offers advantages over commercial products in several scenarios. Custom concentrations allow for precise dose titration, combination formulations (such as testosterone with anastrozole) improve convenience and compliance, and alternative delivery methods like topical creams can be tailored to individual absorption patterns.",
      "Monitoring is critical during testosterone therapy. Providers should check testosterone levels, hematocrit, PSA, lipid panel, and liver function at regular intervals. The goal is to restore testosterone to the mid-normal range while minimizing side effects.",
      "Logos RX compounds testosterone cypionate in multiple concentrations for intramuscular and subcutaneous injection, as well as topical formulations. Our pharmacists are available to consult with providers on dosing strategies and formulation options.",
    ],
  },
  {
    title: "How to Properly Store and Handle Injectable Medications",
    slug: "storing-handling-injectable-medications",
    category: "Patient Education",
    excerpt:
      "Proper storage and handling of injectable medications is essential for safety and efficacy. Here's everything patients need to know.",
    date: "2026-01-28",
    content: [
      "Injectable medications require careful storage and handling to maintain their potency, sterility, and safety. Whether you've been prescribed NAD+, sermorelin, testosterone, or glutathione, following proper storage guidelines ensures you receive the full therapeutic benefit of each dose.",
      "Temperature is the most critical storage factor. Most compounded injectables should be stored in a refrigerator between 36°F and 46°F (2°C to 8°C) unless otherwise specified on the label. Never freeze injectable medications unless explicitly instructed to do so, as freezing can damage proteins and alter the medication's molecular structure.",
      "When preparing for injection, remove the vial from the refrigerator and allow it to reach room temperature for 15-20 minutes before use. Cold injections can be uncomfortable and may cause localized reactions. Never use a microwave, hot water, or direct heat to warm medications — this can degrade active ingredients.",
      "Proper injection technique begins with hand hygiene. Wash your hands thoroughly with soap and water. Clean the rubber stopper of the vial with an alcohol swab and allow it to dry before inserting a needle. Use a new, sterile needle and syringe for each injection — never reuse needles.",
      "For intramuscular (IM) injections, common sites include the deltoid (upper arm), vastus lateralis (outer thigh), and ventrogluteal (hip) muscles. For subcutaneous (SubQ) injections, the abdomen (avoiding 2 inches around the navel) and outer thigh are preferred. Rotate injection sites to prevent tissue irritation and lipodystrophy.",
      "After injection, dispose of needles and syringes in a proper sharps container — never in regular trash. Most pharmacies and municipalities offer sharps disposal programs. When your sharps container is three-quarters full, seal it and follow local guidelines for disposal.",
      "Always check the beyond-use date (BUD) on your vial before each use. Do not use medication past its BUD. If you notice any changes in color, clarity, or particulate matter in your injectable, do not use it — contact your pharmacy for a replacement.",
      "If you have questions about storing or administering your compounded medications, the Logos RX team is available to help. Our pharmacists can walk you through proper technique and answer any questions about your specific formulation.",
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  if (category === "All") return articles;
  return articles.filter((a) => a.category === category);
}
