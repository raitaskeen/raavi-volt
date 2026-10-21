import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy policy" intro="Last updated: October 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Order details: your name, mobile number, optional email and delivery address.</li>
          <li>Payment confirmation: the transaction reference, sender name and any screenshot you upload.</li>
          <li>Your cart is stored only in your own browser until you check out.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          Only to verify payments, deliver your order, provide after-sales support and handle warranty claims. We never sell your data and never ask
          for card numbers or banking passwords.
        </p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>Your name, phone and address are shared with our delivery partner solely to deliver your parcel.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          To access or delete your information, contact {store.contact.email} or WhatsApp {store.contact.phone}.
        </p>
      </section>
    </InfoPage>
  );
}
