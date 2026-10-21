import type { Metadata } from "next";
import { InfoPage } from "@/components/site/info-page";
import { orderHoldHours, shipping, store } from "@/config/store";
import { formatPKR } from "@/lib/utils";

export const metadata: Metadata = { title: "Shipping & returns", description: "Delivery times, fees, replacements and warranty claims." };

export default function ShippingReturnsPage() {
  return (
    <InfoPage eyebrow="Help" title="Shipping & returns">
      <section>
        <h2>Delivery</h2>
        <ul>
          <li>
            Lahore: {shipping.lahoreEta.toLowerCase()} — {formatPKR(shipping.lahoreFee)}.
          </li>
          <li>
            Rest of Pakistan: {shipping.nationwideEta.toLowerCase()} by courier — {formatPKR(shipping.nationwideFee)}.
          </li>
          <li>Free delivery on orders of {formatPKR(shipping.freeOver)} or more.</li>
          <li>Orders are dispatched once payment is verified (usually within an hour during business hours).</li>
        </ul>
      </section>
      <section>
        <h2>Payment window</h2>
        <p>
          Stock is reserved for {orderHoldHours} hours after you place an order. Orders that remain unpaid after that are automatically cancelled.
        </p>
      </section>
      <section>
        <h2>Damaged or wrong item</h2>
        <p>
          Please check your parcel on delivery. If an item arrives damaged, faulty or isn&apos;t what you ordered, message us on WhatsApp within 7 days
          with your order number and photos — we&apos;ll arrange a free replacement or refund.
        </p>
      </section>
      <section>
        <h2>Change of mind</h2>
        <p>
          Unused items in original, sealed packaging can be returned within 7 days. Return delivery is paid by the customer; we refund to your bank
          account within 3 working days of receiving the item.
        </p>
      </section>
      <section>
        <h2>Warranty</h2>
        <p>
          Products carry the manufacturer&apos;s warranty shown on each product page. Keep your order number — {store.name} will help you lodge claims
          with the brand&apos;s authorised service centre.
        </p>
      </section>
    </InfoPage>
  );
}
