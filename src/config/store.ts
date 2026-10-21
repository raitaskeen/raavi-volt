/**
 * Store-wide settings. Everything marked `TODO` is placeholder data —
 * replace it with real business details before going live.
 */
export const store = {
  name: "Raavi Volt",
  tagline: "Lahore's all-in-one electric store",
  description:
    "Genuine Geepas and top-brand electric appliances — kitchen, home, cooling, lighting and personal care — delivered across Lahore and Pakistan.",
  url: "https://amirstore.tech",
  currency: "PKR",
  contact: {
    phone: "+92 301 4865252",
    whatsapp: "923014865252", // digits only, used for wa.me links and admin alerts
    email: "owner@amirstore.tech",
    address: "99-E, Street 3, Block E, near Dar-e-Arqam School, Defence Fort, Ghazi Road, Lahore",
    hours: "Open daily · 8am – 10pm",
  },
  /** Authorised dealer status shown in trust badges (keep accurate). */
  authorisedDealerOf: "Geepas",
  social: {
    instagram: "", // TODO: provided later
    facebook: "", // TODO: provided later
  },
} as const;

/** Delivery fees in whole PKR. */
export const shipping = {
  lahoreFee: 250,
  nationwideFee: 450,
  freeOver: 10_000,
  lahoreEta: "Same / next day in Lahore",
  nationwideEta: "2–4 working days nationwide",
} as const;

/** Unpaid orders are auto-cancelled (and restocked) after this many hours. */
export const orderHoldHours = 72;

export function shippingFor(city: string, subtotal: number) {
  if (subtotal >= shipping.freeOver) return 0;
  return city.trim().toLowerCase() === "lahore" ? shipping.lahoreFee : shipping.nationwideFee;
}

export type PaymentAccount = {
  id: string;
  /** Bank or wallet name shown to the customer. */
  bank: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  /**
   * Path to the Raast / bank-app QR image in /public (e.g. "/payments/meezan.png").
   * Leave undefined to auto-generate a QR that encodes the IBAN / account number.
   */
  qrImage?: string;
};

/** TODO: replace with your real accounts and drop QR images into /public/payments. */
export const paymentAccounts: PaymentAccount[] = [
  {
    id: "meezan",
    bank: "Meezan Bank",
    accountTitle: "Raavi Volt",
    accountNumber: "0201 0000000000",
    iban: "PK00MEZN0002010000000000",
  },
  {
    id: "hbl",
    bank: "HBL",
    accountTitle: "Raavi Volt",
    accountNumber: "1234 5678 9012 34",
    iban: "PK00HABB0012345678901234",
  },
  {
    id: "jazzcash",
    bank: "JazzCash",
    accountTitle: "Raavi Volt",
    accountNumber: "0300 0000000",
  },
  {
    id: "easypaisa",
    bank: "Easypaisa",
    accountTitle: "Raavi Volt",
    accountNumber: "0345 0000000",
  },
];

export const categories = [
  { slug: "kitchen", name: "Kitchen", long: "Kitchen Appliances", icon: "kitchen", blurb: "Air fryers, blenders, kettles & more" },
  { slug: "home", name: "Home Care", long: "Home Appliances", icon: "home", blurb: "Irons, steamers & vacuums" },
  { slug: "cooling-heating", name: "Cooling & Heating", long: "Cooling & Heating", icon: "fan", blurb: "Rechargeable fans & heaters" },
  { slug: "lighting", name: "Lighting & Power", long: "Lighting & Power", icon: "light", blurb: "Lanterns, emergency lights, torches" },
  { slug: "personal-care", name: "Personal Care", long: "Personal Care", icon: "care", blurb: "Dryers, straighteners & trimmers" },
  { slug: "electronics", name: "Audio & Tech", long: "Audio & Electronics", icon: "audio", blurb: "Speakers & everyday tech" },
  { slug: "tools", name: "Tools", long: "Tools & DIY", icon: "tools", blurb: "Drills & power tools" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
export type CategoryIconKey = (typeof categories)[number]["icon"];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export const brands = ["Geepas", "Anex", "Westpoint", "Philips", "Panasonic", "Kenwood", "Black+Decker", "Other"] as const;

export const cities = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Peshawar",
  "Quetta",
  "Sheikhupura",
  "Kasur",
  "Sahiwal",
  "Bahawalpur",
  "Sargodha",
  "Hyderabad",
] as const;

/** Suggested areas for the Lahore address field (free text still allowed). */
export const lahoreAreas = [
  "DHA Phase 1–8",
  "Gulberg",
  "Model Town",
  "Johar Town",
  "Bahria Town",
  "Wapda Town",
  "Garden Town",
  "Faisal Town",
  "Cantt",
  "Iqbal Town",
  "Township",
  "Valencia",
  "Lake City",
  "Shadman",
  "Samanabad",
  "Allama Iqbal Town",
  "Cavalry Ground",
  "Askari",
  "Raiwind Road",
  "Walled City",
] as const;

export const orderStatuses = [
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "payment_submitted", label: "Payment submitted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["value"];

export function statusLabel(status: string) {
  return orderStatuses.find((s) => s.value === status)?.label ?? status;
}

/** Couriers offered when marking an order as shipped. */
export const couriers = ["Own rider (Lahore)", "TCS", "Leopards", "M&P", "PostEx", "Trax", "BlueEx", "Call Courier"] as const;

/** Human delivery estimate used in WhatsApp shipping updates. */
export function deliveryEta(city: string) {
  return city.trim().toLowerCase() === "lahore" ? "within 24 hours" : "in 2–4 working days";
}

/**
 * WhatsApp Cloud API settings. Credentials are secrets (see README):
 * WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID. Without them, messages are
 * logged as "skipped" and admins can still send them manually.
 */
export const whatsappConfig = {
  /** Store owner's WhatsApp (digits, intl format) — receives new order / payment / contact alerts. */
  adminNumber: store.contact.whatsapp,
  /** Language code the templates were approved in. */
  language: "en",
} as const;

export const contactTopics = ["Order status", "Product question", "Warranty / repair", "Bulk / corporate order", "Other"] as const;
