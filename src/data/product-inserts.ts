export interface ProductInsertImage {
  src: string;
  alt: string;
}

export interface ProductInsertSection {
  title: string;
  content: string[];
  image?: ProductInsertImage;
}

export interface ProductInsert {
  slug: string;
  title: string;
  subtitle: string;
  sections: ProductInsertSection[];
}

export const productInserts: ProductInsert[] = [
  {
    slug: "intramuscular-injections",
    title: "Intramuscular Injections",
    subtitle:
      "A step-by-step guide for intramuscular (IM) injection technique, site selection, and safety protocols.",
    sections: [
      {
        title: "Overview",
        content: [
          "Intramuscular (IM) injections deliver medication deep into the muscle tissue, allowing for rapid and efficient absorption into the bloodstream. This route is commonly used for hormone therapies, vitamins, and other compounded medications prescribed by your healthcare provider.",
          "Always follow your provider's specific instructions regarding dosage, frequency, and injection site. This guide is for general educational purposes and does not replace personalized medical advice.",
        ],
      },
      {
        title: "Required Materials",
        content: [
          "Before starting, gather all supplies: your prescribed medication vial, an alcohol swab, a drawing needle (typically 18G), an injection needle (typically 22–25G, 1–1.5 inches), a syringe of appropriate volume, a sharps disposal container, and a clean bandage or cotton ball.",
          "Ensure all packaging is intact and that the medication has not expired. Check the solution for any discoloration, particles, or cloudiness. If anything appears abnormal, do not use the medication and contact Logos RX or your provider.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig1-supplies.png",
          alt: "Figure 1: Required supplies for injectable medication including medication vial, diluent, syringe, sharps container, alcohol swabs, and adhesive bandages",
        },
      },
      {
        title: "Preparation",
        content: [
          "Step 1: Wash your hands thoroughly with soap and warm water for at least 20 seconds. Dry with a clean towel.",
          "Step 2: Clean the top of the medication vial with an alcohol swab and allow it to air dry.",
          "Step 3: Attach the drawing needle to the syringe. Pull back the plunger to fill the syringe with air equal to your prescribed dose.",
          "Step 4: Insert the drawing needle into the vial and push the air in. Invert the vial and slowly draw the medication to the prescribed dose. Tap the syringe gently to move air bubbles to the top, then push the plunger slightly to expel any air.",
          "Step 5: Remove the drawing needle and replace it with the injection needle. Do not touch the needle tip.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig2-syringe-draw.png",
          alt: "Figure 2: Syringe with measurement markings and technique for drawing medication from an inverted vial",
        },
      },
      {
        title: "Injection Site Selection",
        content: [
          "The most common IM injection sites are the vastus lateralis (outer thigh), the deltoid muscle (upper arm), and the ventrogluteal muscle (hip). Your provider will recommend the best site for your specific medication.",
          "Vastus lateralis (thigh): Divide the front of the thigh into three equal sections. The injection site is in the outer middle third of the thigh.",
          "Deltoid (upper arm): Locate the thick, triangular muscle that forms the rounded contour of the shoulder. The injection site is roughly 2–3 finger-widths below the acromion process.",
          "Ventrogluteal (hip): Place the heel of your hand on the greater trochanter of the hip bone. Point your index finger toward the anterior iliac crest and spread your middle finger toward the iliac spine. Inject in the center of the V formed by your fingers.",
          "Rotate injection sites with each dose to prevent tissue irritation, scarring, or lipodystrophy.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig5-im-sites.png",
          alt: "Figure 5: Intramuscular injection sites showing deltoid, vastus lateralis, and ventrogluteal on front and side body views",
        },
      },
      {
        title: "Administration",
        content: [
          "Step 1: Clean the injection site with a new alcohol swab using a circular motion from the center outward. Allow it to air dry completely.",
          "Step 2: Hold the syringe in your dominant hand like a dart. With your other hand, spread the skin taut at the injection site (or use the Z-track method as directed by your provider).",
          "Step 3: Insert the needle at a 90-degree angle in one quick, smooth motion. Insert the needle fully to the hub.",
          "Step 4: Slowly and steadily push the plunger to inject the medication. This should take approximately 10 seconds per mL to minimize discomfort.",
          "Step 5: Wait 5–10 seconds after injecting before withdrawing the needle in one smooth motion at the same angle it was inserted.",
          "Step 6: Apply gentle pressure to the site with a cotton ball or bandage. Do not rub the injection site.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig3-angles.png",
          alt: "Figure 4: Injection technique showing 90-degree and 45-degree needle angles with skin cross-section showing subcutaneous and muscle layers",
        },
      },
      {
        title: "Post-Injection Care",
        content: [
          "Mild soreness, redness, or swelling at the injection site is normal and typically resolves within 1–2 days. Applying a warm compress to the area may help reduce discomfort.",
          "If you experience persistent pain, significant swelling, signs of infection (redness, warmth, pus), fever, or an allergic reaction (hives, difficulty breathing), contact your healthcare provider immediately or seek emergency medical care.",
        ],
      },
      {
        title: "Storage & Disposal",
        content: [
          "Store your medication as directed on the label — most injectable medications should be kept at room temperature (68–77°F) and away from direct sunlight. Some medications require refrigeration; refer to your specific product label.",
          "Dispose of all used needles and syringes immediately in an FDA-cleared sharps container. Never recap, bend, or break needles. When the sharps container is three-quarters full, seal it and follow your community's disposal guidelines or contact Logos RX for assistance.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig6-disposal.png",
          alt: "Figure 7: Proper sharps disposal technique showing hand dropping used syringe into biohazard sharps container",
        },
      },
      {
        title: "When to Contact Your Provider",
        content: [
          "Contact your healthcare provider or Logos RX if you have questions about your injection technique, if you notice changes in your medication's appearance, if you experience unusual side effects, or if you need guidance on sharps disposal.",
          "For urgent medical concerns, please call 911 or go to your nearest emergency room.",
        ],
      },
    ],
  },
  {
    slug: "subcutaneous-injections",
    title: "Subcutaneous Injections",
    subtitle:
      "A step-by-step guide for subcutaneous (SubQ) injection technique, site rotation, and proper disposal.",
    sections: [
      {
        title: "Overview",
        content: [
          "Subcutaneous (SubQ) injections deliver medication into the fatty tissue layer between the skin and the muscle. This route provides slower, more sustained absorption than intramuscular injections and is commonly used for hormones, peptides, and other compounded therapies.",
          "Always follow your provider's specific instructions regarding dosage, frequency, and injection site. This guide is for general educational purposes and does not replace personalized medical advice.",
        ],
      },
      {
        title: "Required Materials",
        content: [
          "Before starting, gather all supplies: your prescribed medication vial, an alcohol swab, a subcutaneous needle (typically 25–30G, ½–⅝ inch), a syringe of appropriate volume, a sharps disposal container, and a clean bandage or cotton ball.",
          "Ensure all packaging is intact and that the medication has not expired. Inspect the solution for any discoloration, particles, or cloudiness. If anything appears abnormal, do not use the medication and contact Logos RX or your provider.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig1-supplies.png",
          alt: "Figure 1: Required supplies for injectable medication including medication vial, diluent, syringe, sharps container, alcohol swabs, and adhesive bandages",
        },
      },
      {
        title: "Preparation",
        content: [
          "Step 1: Wash your hands thoroughly with soap and warm water for at least 20 seconds. Dry with a clean towel.",
          "Step 2: Clean the top of the medication vial with an alcohol swab and allow it to air dry.",
          "Step 3: Attach the needle to the syringe. Pull back the plunger to fill the syringe with air equal to your prescribed dose.",
          "Step 4: Insert the needle into the vial and push the air in. Invert the vial and slowly draw the medication to the prescribed dose. Tap the syringe gently to move air bubbles to the top, then push the plunger slightly to expel any air.",
          "Step 5: Remove the needle from the vial. If using a separate injection needle, swap it now. Do not touch the needle tip.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig2-syringe-draw.png",
          alt: "Figure 2: Syringe with measurement markings and technique for drawing medication from an inverted vial",
        },
      },
      {
        title: "Injection Site Selection",
        content: [
          "Common subcutaneous injection sites include the abdomen (at least 2 inches from the navel), the front or outer thigh, and the back of the upper arm. Your provider will recommend the best site for your specific medication.",
          "Abdomen: The preferred site for many SubQ medications. Choose an area at least 2 inches away from the belly button, avoiding any scars, bruises, or stretch marks.",
          "Thigh: Use the front or outer area of the thigh, roughly halfway between the knee and hip.",
          "Upper arm: Use the fatty area on the back of the arm between the shoulder and elbow. This site may require assistance from another person.",
          "Rotate injection sites systematically — for example, use different quadrants of the abdomen or alternate between left and right sides. Keep at least 1 inch between injection points to prevent tissue changes.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig4-subq-sites.png",
          alt: "Figure 5: Subcutaneous injection sites showing abdomen, upper thigh, and upper arm on front and back body views",
        },
      },
      {
        title: "Administration",
        content: [
          "Step 1: Clean the injection site with a new alcohol swab using a circular motion from the center outward. Allow it to air dry completely.",
          "Step 2: Pinch a 1–2 inch fold of skin and fatty tissue at the injection site with your non-dominant hand.",
          "Step 3: Hold the syringe in your dominant hand like a pencil or dart. Insert the needle at a 45-degree angle (for shorter needles) or a 90-degree angle (for ½-inch needles or if pinching a large skin fold). Insert in one quick, smooth motion.",
          "Step 4: Release the skin pinch. Slowly push the plunger to inject the medication over 5–10 seconds.",
          "Step 5: Wait 5 seconds after injecting, then withdraw the needle at the same angle it was inserted in one smooth motion.",
          "Step 6: Apply gentle pressure with a cotton ball or bandage. Do not rub the site, as this can affect absorption.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig3-angles.png",
          alt: "Figure 4: Injection technique showing 90-degree and 45-degree needle angles with skin cross-section and pinching technique",
        },
      },
      {
        title: "Post-Injection Care",
        content: [
          "Mild redness, bruising, or a small bump at the injection site is normal and typically resolves within a few days. Avoid tight clothing over the injection area.",
          "If you experience persistent pain, significant swelling, signs of infection (increasing redness, warmth, pus, or red streaking), fever, or an allergic reaction (hives, swelling, difficulty breathing), contact your healthcare provider immediately or seek emergency care.",
        ],
      },
      {
        title: "Storage & Disposal",
        content: [
          "Store your medication as directed on the label. Most SubQ medications should be kept at room temperature (68–77°F) away from direct sunlight, though some may require refrigeration. Always check your specific product label for storage instructions.",
          "Dispose of all used needles and syringes immediately in an FDA-cleared sharps container. Never recap, bend, or break needles. When the container is three-quarters full, seal it and follow your community's disposal guidelines or contact Logos RX for assistance.",
        ],
        image: {
          src: "/images/product-inserts/insert-fig6-disposal.png",
          alt: "Figure 7: Proper sharps disposal technique showing hand dropping used syringe into biohazard sharps container",
        },
      },
      {
        title: "When to Contact Your Provider",
        content: [
          "Contact your healthcare provider or Logos RX if you have questions about your injection technique, if you notice changes in your medication's appearance, if you miss a dose, if you experience unusual side effects, or if you need guidance on sharps disposal.",
          "For urgent medical concerns, please call 911 or go to your nearest emergency room.",
        ],
      },
    ],
  },
];

export function getProductInsert(slug: string): ProductInsert | undefined {
  return productInserts.find((insert) => insert.slug === slug);
}
