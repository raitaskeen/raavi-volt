import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CartSheet } from "@/components/site/cart-sheet";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-50 rounded bg-ink px-3 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="min-h-[60dvh]">
        {children}
      </main>
      <Footer />
      <CartSheet />
      <WhatsAppFab />
    </>
  );
}
