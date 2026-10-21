# Raavi Volt — Lahore's all-in-one electric store

A fast, minimal e-commerce store for Geepas and other electric appliances, built for **Cloudflare Workers**.
Monochrome base (matte black · charcoal · white · paper white) with two electric accents — **volt lime** for energy and CTAs, **flame orange** for deals — plus cart + checkout, **manual bank / Raast QR payments**, and a built-in admin dashboard.

> **Raavi** = the Ravi river of Lahore. **Volt** = everything electric.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime / deploy | Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Package manager | Bun |
| UI | Tailwind CSS v4, shadcn/ui (new-york, `radix-ui`), lucide icons + custom WhatsApp glyph |
| Type | Archivo (expanded display, variable width axis) · Geist (UI) · Geist Mono (labels) via `next/font` |
| Animation | Motion (Framer Motion) with `LazyMotion` + `domAnimation` (~15 kB) |
| Data | Cloudflare **D1** (SQLite) — products & orders |
| Media | Cloudflare **R2** — product images (public, immutable cache) & payment screenshots (private) |
| Validation | Zod v4 (server-side, every action) |
| Cart | Zustand + localStorage |

## Features

**Storefront**
- Scrolling **deals strip** above the header, fed live from the biggest discounts in D1 (pauses on hover)
- Home: hero with **Deal of the day** + countdown to midnight PKT, brand marquee, categories, hot deals, best sellers, shop-by-budget, load-shedding promo, how-to-pay
- Shop: filter sidebar (mobile: bottom sheet) — category & brand with live counts, price ranges + custom min/max, on-sale, in-stock; removable filter chips; sort; pagination
- Product cards: discount / best-seller badges, low-stock urgency, free-delivery tag, hover second image, one-tap add
- Product page: gallery, savings, Lahore delivery-date estimate, Buy now / Add to cart / **Order on WhatsApp**, sticky mobile buy bar, specs, JSON-LD
- Slide-over cart + full cart page, free-delivery progress bar
- Checkout: progress steps, **remembers returning customers** (opt-in, on-device), Pakistani mobile validation/normalisation, city select, Lahore area suggestions, `autocomplete`/`inputMode` everywhere
- **Track order** page (order number + phone), About, Contact, Shipping & returns, Privacy, Terms, branded 404 / error pages
- Floating WhatsApp chat button
- Server re-prices every order from D1 (never trusts the client); stock is decremented atomically in a D1 batch
- Order page: amount due, **QR code + bank/IBAN details with copy buttons**, "I've paid" form (transaction ID + screenshot upload), WhatsApp shortcut, status tracker

**Admin (`/admin`)**
- Password login (HMAC-signed, httpOnly cookie)
- Dashboard: payments to verify, awaiting payment, revenue, low stock, recent orders
- Products: list/search/filter, **add / edit / delete**, multi-image upload (auto-compressed to WebP in the browser, drag & drop, reorder, cover image), specs editor, featured / live toggles
- Orders: filter by status, view payment proof, **one-click next step** (verify & confirm → shipped → delivered), manual status override (cancelling restocks items), call / WhatsApp the customer

**Production hardening**
- Workers Rate Limiting on login, checkout, payment submit and order lookup
- Unpaid orders auto-cancel and restock after 72 h (`orderHoldHours`)
- HSTS, nosniff, frame, referrer and permissions headers; admin routes and payment proofs require a signed session
- Above-the-fold content uses CSS entrance animations (paints before JS); `LazyMotion` for the rest; reduced-motion respected

## Local development

```bash
bun install
cp .dev.vars.example .dev.vars       # then set ADMIN_PASSWORD and SESSION_SECRET
bun run local                        # migrates + seeds local D1, then starts http://localhost:3000
```

Open http://localhost:3000 for the store and http://localhost:3000/admin for the dashboard.
`bun run local` is safe to re-run — migrations are tracked and the seed skips existing products.
After the first run, plain `bun run dev` is enough. Port busy? `bun run dev -- -p 3100`.

`next dev` gets real D1/R2 bindings through Wrangler's local emulation (state in `.wrangler/`).
To run the exact production Worker bundle locally in workerd instead, use `bun run preview`.

> **Windows tip:** if local D1 fails with `SQLITE_CANTOPEN`, your folder path is too long. Use a short state dir:
> `wrangler d1 migrations apply DB --local --persist-to C:\rv-state` (same for `execute`), then run dev with `WRANGLER_PERSIST_DIR=C:\rv-state`.

## Deploy to Cloudflare Workers

```bash
bunx wrangler login
bunx wrangler d1 create raavi-volt-db        # copy the database_id into wrangler.jsonc
bunx wrangler r2 bucket create raavi-volt-media
bunx wrangler secret put ADMIN_PASSWORD
bunx wrangler secret put SESSION_SECRET      # any random 32+ char string
bun run db:migrate:remote
bun run db:seed:remote                       # optional starter catalog
bun run deploy
```

Or push to `main` and let **GitHub Actions** deploy (`.github/workflows/deploy.yml`) — add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.
The OpenNext build is verified on Windows as well — `bun run preview` runs the real Worker bundle locally in workerd.

## Make it yours

Everything placeholder lives in **`src/config/store.ts`** (marked `TODO`):

- `store` — domain, phone, WhatsApp, email, address
- `paymentAccounts` — your bank / JazzCash / Easypaisa accounts. Put your **Raast QR images** in `public/payments/` and set `qrImage: "/payments/<file>.png"`. Without an image, a QR encoding the IBAN / number is generated automatically.
- `shipping` — Lahore fee, nationwide fee, free-delivery threshold
- `categories`, `brands`, `cities`, `lahoreAreas`

Starter products live in `db/seed-data.ts` (regenerate SQL with `bun run db:seed:gen`). Add real photos from **/admin**.

## Project structure

```
src/
  app/
    (store)/            storefront: home, shop, product/[slug], cart, checkout, order/[code]
    admin/              login, (panel)/ dashboard, products, orders, api/upload, proof/
    media/[...key]      public R2 image route (edge-cached, immutable)
  components/ui         shadcn/ui primitives
  components/site       storefront components
  components/admin      admin components
  config/store.ts       business settings
  lib/                  D1 queries (products, orders), auth, validation, cart store
migrations/             D1 schema
db/                     seed data + generated seed.sql
```
