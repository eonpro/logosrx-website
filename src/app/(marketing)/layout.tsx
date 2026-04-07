import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main-content" className="relative flex-1 pt-[72px]">
        {children}
      </main>
      <Footer />
    </>
  );
}
