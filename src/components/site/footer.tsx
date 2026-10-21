import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { categories, paymentAccounts, shipping, store } from "@/config/store";

export function Footer() {
  return (
    <footer className="mt-24 bg-matte text-white">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-4">
          <Logo inverse />
          <p className="max-w-xs text-sm text-white/60">{store.description}</p>
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-volt/40 px-3 py-1 text-xs font-medium text-volt">
            <span className="size-1.5 rounded-full bg-volt" aria-hidden /> Authorised {store.authorisedDealerOf} dealer
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-white/50">Shop</h3>
          <ul className="grid gap-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="text-white/80 hover:text-white">
                  {c.long}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-white/50">Help</h3>
          <ul className="grid gap-2.5 text-sm">
            {[
              ["/track", "Track your order"],
              ["/shipping-returns", "Shipping & returns"],
              ["/about", "About us"],
              ["/contact", "Contact"],
              ["/privacy", "Privacy policy"],
              ["/terms", "Terms of sale"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-white/80 hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-white/45">
            {shipping.lahoreEta}. Pay via {paymentAccounts.map((a) => a.bank).join(" · ")}.
          </p>
        </div>
        <div>
          <h3 className="eyebrow mb-4 text-white/50">Visit / Contact</h3>
          <address className="grid gap-2.5 text-sm text-white/80 not-italic">
            <span>{store.contact.address}</span>
            <span>{store.contact.hours}</span>
            <a href={`tel:${store.contact.phone.replace(/\s/g, "")}`} className="hover:text-white">
              {store.contact.phone}
            </a>
            <a href={`https://wa.me/${store.contact.whatsapp}`} className="hover:text-white">
              WhatsApp us
            </a>
            <a href={`mailto:${store.contact.email}`} className="hover:text-white">
              {store.contact.email}
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 font-mono text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name}. Made in Lahore.
          </p>
          <p>Prices in PKR, inclusive of applicable taxes.</p>
        </div>
      </div>
    </footer>
  );
}
