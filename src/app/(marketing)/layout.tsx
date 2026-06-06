import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { RevealObserver } from "@/components/marketing/reveal-observer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="top" className="flex min-h-full flex-col">
      {/* Sin JS: mostrar todo el contenido de reveal (no dejarlo en opacity:0) */}
      <noscript>
        <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <RevealObserver />
    </div>
  );
}
