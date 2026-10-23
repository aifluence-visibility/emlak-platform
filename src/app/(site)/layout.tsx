import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PreviewBanner from "@/components/PreviewBanner";
import CompareTray from "@/components/CompareTray";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreviewBanner />
      <Header />
      <main>{children}</main>
      <Footer />
      <CompareTray />
    </>
  );
}
