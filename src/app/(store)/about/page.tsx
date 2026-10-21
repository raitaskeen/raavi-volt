import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InfoPage } from "@/components/site/info-page";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "About us", description: `${store.name} — ${store.tagline}.` };

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About" title="Power, made simple — from Lahore." intro={store.description}>
      <section>
        <h2>Why we started</h2>
        <p>
          Buying an air fryer or a rechargeable fan shouldn&apos;t mean trawling Hall Road or guessing whether a listing is genuine. {store.name} brings
          trusted electric brands — led by Geepas — into one clean, honest store with real prices, real stock and real people on WhatsApp.
        </p>
      </section>
      <section>
        <h2>What we promise</h2>
        <ul>
          <li>Only genuine products from authorised distributors, with brand warranty.</li>
          <li>Clear prices in PKR — no hidden charges at checkout.</li>
          <li>Simple bank / Raast QR payments; no card details ever needed.</li>
          <li>Fast delivery across Lahore and courier delivery nationwide.</li>
        </ul>
      </section>
      <section>
        <h2>Visit or reach us</h2>
        <p>
          {store.contact.address} · {store.contact.hours}
          <br />
          Phone / WhatsApp: {store.contact.phone} · {store.contact.email}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/shop">Shop the range</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </InfoPage>
  );
}
