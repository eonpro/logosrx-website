import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import HashScroller from "@/components/HashScroller";
import ChatWidget from "@/components/ChatWidget";
import { ReducedMotionProvider } from "@/components/ReducedMotionProvider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionProvider>
      <SmoothScroll />
      <HashScroller />
      <Header />
      <main id="main-content" className="relative flex-1 pt-[72px]">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </ReducedMotionProvider>
  );
}
