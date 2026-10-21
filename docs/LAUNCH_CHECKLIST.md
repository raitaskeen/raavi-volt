# Launch checklist — what Raavi Volt needs from you

Fill in what you can and send it over; anything marked 🔒 is a secret — **set it yourself**
(commands below) and never paste it into chat, email or the repo.

## 1. Business identity
- [ ] Final store name (keep **Raavi Volt** or give an alternative)
- [ ] Domain you own or want (e.g. `raavivolt.pk` / `raavivolt.com`) — added to Cloudflare DNS
- [ ] Logo (SVG/PNG) — or keep the current bolt mark
- [ ] Shop / pickup address and opening hours
- [ ] Customer phone number and **customer WhatsApp number**
- [ ] **Admin WhatsApp number** that should receive new-order / payment / message alerts
- [ ] Support email
- [ ] Social links: Instagram, Facebook, TikTok (any you use)
- [ ] Registered business name + NTN (optional, for legal pages / invoices)
- [ ] Are you an authorised Geepas dealer? (needed to keep the “100% genuine / brand warranty” claims)

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
- [ ] **Cloudflare** account — Workers **Paid plan ($5/month) recommended** for a Next.js store
- [ ] 🔒 `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` → GitHub repo → *Settings → Secrets → Actions*
- [ ] 🔒 Admin password → `bunx wrangler secret put ADMIN_PASSWORD`
- [ ] 🔒 Session secret (any long random string) → `bunx wrangler secret put SESSION_SECRET`
- [ ] **Meta / WhatsApp Business** — verified Business account, a dedicated WhatsApp number,
      8 approved templates (see [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md))
- [ ] 🔒 `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` → `bunx wrangler secret put …`

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
