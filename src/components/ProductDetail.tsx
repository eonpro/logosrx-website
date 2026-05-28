import type { Product } from "@/data/products";
import ProductHero from "./product/ProductHero";
import ProductIngredients from "./product/ProductIngredients";
import ProductHowToTake from "./product/ProductHowToTake";
import ProductDetailsTable from "./product/ProductDetailsTable";
import ProductDosageSchedule from "./product/ProductDosageSchedule";
import ProductFAQ from "./product/ProductFAQ";
import ProductPrescribeCTA from "./product/ProductPrescribeCTA";
import ProductRelated from "./product/ProductRelated";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

/**
 * Hims-style product detail page composition.
 *
 * Order matches the reference flow (`https://www.hims.com/weight-loss/zepbound-vial`):
 *   1. Hero — category + badges + name + tagline + key bullets + image + CTA
 *   2. Ingredients — "About the ingredient" + highlight cards
 *   3. How to take — numbered steps
 *   4. Product Details — formulation/variant table
 *   5. Dosage Schedule — titration table
 *   6. FAQ — collapsible Q&A
 *   7. Prescribe CTA — dark navy callout with portal link
 *   8. Related products — three-card grid
 */
export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  return (
    <article className="bg-white">
      <ProductHero product={product} />
      <ProductIngredients product={product} />
      <ProductHowToTake product={product} />
      <ProductDetailsTable product={product} />
      <ProductDosageSchedule product={product} />
      <ProductFAQ product={product} />
      <ProductPrescribeCTA productName={product.name} />
      <ProductRelated products={relatedProducts} />
    </article>
  );
}
