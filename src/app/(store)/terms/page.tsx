import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { orderHoldHours, store } from "@/config/store";

export const metadata: Metadata = { title: "Terms of sale" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title="Terms of sale" intro="Last updated: October 2026">
      <section>
        <h2>Prices</h2>
        <p>All prices are in Pakistani Rupees (PKR) and include applicable taxes. Prices and availability can change without notice until an order is placed.</p>
      </section>
      <section>
        <h2>Orders & payment</h2>
        <p>
          An order is confirmed once {store.name} verifies your bank, Raast, JazzCash or Easypaisa payment. Unpaid orders are cancelled after{" "}
          {orderHoldHours} hours. If an item becomes unavailable after payment, we&apos;ll refund you in full.
        </p>
      </section>
      <section>
        <h2>Delivery, returns & warranty</h2>
        <p>See our Shipping & returns page. Manufacturer warranties apply as stated on each product.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          {store.name}, {store.contact.address}. {store.contact.email}
        </p>
      </section>
    </InfoPage>
  );
}
