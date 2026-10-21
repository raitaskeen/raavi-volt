import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/icons";
import { InfoPage } from "@/components/site/info-page";
import { store } from "@/config/store";

export const metadata: Metadata = { title: "Contact", description: `Call, WhatsApp or visit ${store.name} in Lahore.` };

export default function ContactPage() {
  const items = [
    { icon: Phone, label: "Phone", value: store.contact.phone, href: `tel:${store.contact.phone.replace(/\s/g, "")}` },
    { icon: WhatsAppIcon, label: "WhatsApp", value: "Chat with us", href: `https://wa.me/${store.contact.whatsapp}` },
    { icon: Mail, label: "Email", value: store.contact.email, href: `mailto:${store.contact.email}` },
    { icon: MapPin, label: "Store", value: store.contact.address },
    { icon: Clock, label: "Hours", value: store.contact.hours },
  ];
  return (
    <InfoPage eyebrow="Contact" title="We're a message away." intro="Questions about a product, an order or a warranty claim? WhatsApp is the fastest way to reach us.">
      <ul className="!grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="!ml-0 !list-none bg-card">
            {href ? (
              <a href={href} className="flex items-center gap-4 p-5 hover:bg-paper" target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                <span>
                  <span className="eyebrow block text-muted-foreground">{label}</span>
                  <span className="font-medium text-ink">{value}</span>
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-4 p-5">
                <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                <span>
                  <span className="eyebrow block text-muted-foreground">{label}</span>
                  <span className="font-medium text-ink">{value}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="w-fit">
        <a href={`https://wa.me/${store.contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon className="size-5" /> Start a WhatsApp chat
        </a>
      </Button>
    </InfoPage>
  );
}
