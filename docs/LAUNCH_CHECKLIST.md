# Launch checklist — what Raavi Volt needs from you

Fill in what you can and send it over; anything marked 🔒 is a secret — **set it yourself**
(commands below) and never paste it into chat, email or the repo.

## 1. Business identity
- [x] Store name: **Raavi Volt** (on the amirstore.tech domain)
- [x] Domain: **amirstore.tech** (add it to Cloudflare, then uncomment `routes` in `wrangler.jsonc`)
- [x] Logo: keep the current electric bolt mark
- [x] Address: 99-E, Street 3, Block E, near Dar-e-Arqam School, Defence Fort, Ghazi Road, Lahore
- [x] Hours: daily 8am – 10pm
- [x] Phone + WhatsApp: +92 301 4865252
- [x] Admin WhatsApp for alerts: +92 301 4865252
- [x] Email: owner@amirstore.tech
- [ ] Social links: Instagram, Facebook, TikTok — *coming later*
- [ ] Registered business name + NTN (optional, for legal pages / invoices)
- [x] Authorised Geepas dealer — shown across the store

## 2. Payments (bank transfer / QR)
For **each** account you want customers to pay into:
- [ ] Bank or wallet name (Meezan, HBL, UBL, JazzCash, Easypaisa, SadaPay, NayaPay…)
- [ ] Account title (exactly as the bank shows it)
- [ ] Account number and **IBAN** (banks) / mobile number (wallets)
- [ ] Raast ID, if you have one
- [ ] **QR image** from your bank / wallet app (PNG/JPG screenshot of the “Receive money” QR)
- [ ] Which account should be the default / first choice

## 3. Delivery & policies
- [ ] Lahore delivery fee, nationwide fee, free-delivery threshold (now Rs 250 / Rs 450 / Rs 10,000)
- [ ] Do you ship nationwide or Lahore only? Same-day cut-off time?
- [ ] Couriers you use (TCS, Leopards, M&P, PostEx, Trax, own rider…)
- [ ] Hold time for unpaid orders (now 72 hours)
- [ ] Cash on delivery: allowed for any city / amount, or bank transfer only?
- [ ] Returns: window (now 7 days), who pays return shipping, refund method and timeline
- [ ] Warranty terms per brand and how claims are handled
- [ ] Approval of the Privacy and Terms pages (or your lawyer's version)

## 4. Catalog
Easiest: a spreadsheet (Excel / Google Sheet) with one row per product —
I can add a bulk importer so you don't type 100 products into the admin.
- [ ] Name, brand, category, model / SKU
- [ ] Price, sale “compare-at” price (if discounted), stock quantity
- [ ] Short line (1 sentence) + full description
- [ ] Specs (power, capacity, size, warranty…)
- [ ] 2–5 photos per product — white background, ≥ 1200 px, your own or supplier-licensed
      (don't copy photos from other websites without permission)
- [ ] Which products are “featured / best sellers”
- [ ] Confirm or change the 7 categories and the brand list

## 5. Accounts & access (you create these; I can't create accounts for you)
- [ ] **Cloudflare** account — the **free plan works** (see “Running on free plans” below)
- [ ] 🔒 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` → GitHub repo → *Settings → Secrets → Actions*
- [ ] 🔒 Admin password → `bunx wrangler secret put ADMIN_PASSWORD`
- [ ] 🔒 Session secret (any long random string) → `bunx wrangler secret put SESSION_SECRET`
- [ ] **Meta / WhatsApp Business** — verified Business account, a dedicated WhatsApp number,
      8 approved templates (see [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md))
- [ ] 🔒 `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` → `bunx wrangler secret put …`
- [ ] 🔒 `WHATSAPP_ADMIN_NUMBER` — your **personal** WhatsApp (different from the store number) for alerts and commands
- [ ] Webhook URL `https://amirstore.tech/api/whatsapp/webhook` registered in the Meta app (field: messages)

## 6. Optional extras
- [ ] Cloudflare Web Analytics (free, cookie-less) — just enable it on the domain
- [ ] Google Search Console + sitemap (`/sitemap.xml` is ready)
- [ ] Email receipts (e.g. Resend) in addition to WhatsApp
- [ ] Cash-on-delivery option, discount codes, product reviews

## Where each item goes in the code
| Data | File |
| --- | --- |
| Name, contact, domain, socials | `src/config/store.ts` → `store` |
| Bank / wallet accounts, QR images | `src/config/store.ts` → `paymentAccounts`, images in `public/payments/` |
| Delivery fees, hold time | `src/config/store.ts` → `shipping`, `orderHoldHours` |
| Couriers, categories, brands, cities | `src/config/store.ts` |
| Admin WhatsApp number | `src/config/store.ts` → `whatsappConfig.adminNumber` |
| WhatsApp message wording | `src/lib/whatsapp-templates.ts` (then `bun run whatsapp:doc`) |
| Products and photos | `/admin` (or the bulk importer) |
| Policies | `src/app/(store)/{shipping-returns,privacy,terms}/page.tsx` |

## Running on free plans

**Cloudflare (free)**

| Limit | Free plan | This store |
| --- | --- | --- |
| Worker size (gzip) | 3 MB | **1.46 MB** ✓ |
| Requests | 100,000 / day | plenty for a new store |
| CPU per request | 10 ms | usually fine; if the dashboard shows "exceeded CPU" errors under load, upgrade to Workers Paid ($5/mo) |
| D1 database | 5 GB, 5M reads / day | ✓ |
| R2 images | 10 GB free | Cloudflare asks for a card to *enable* R2; usage inside the free tier is not charged |

**WhatsApp (free option)**

- **Manual mode — 100% free, active now.** Each order page in the admin shows a green *Open in WhatsApp*
  button with the exact message for the current stage. One tap from your own WhatsApp / WhatsApp Business
  app on +92 301 4865252.
- **Automatic mode — WhatsApp Cloud API, run free.** The store asks customers to tap *Get updates on
  WhatsApp* (they message you first), then replies, takes payment screenshots and sends every update
  inside WhatsApp's free 24-hour window. Outside the window it holds the update (free) unless you switch
  `outsideWindow` to `"template"` (billed per message by Meta). Full flow: [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md).
- Unofficial "free WhatsApp bot" tools break WhatsApp's terms and get numbers banned, so the store does not use them.
