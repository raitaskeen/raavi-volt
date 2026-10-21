# Go live — Raavi Volt on amirstore.tech

Everything below runs on **free plans**. Do the steps in order; each takes a few minutes.

## 1. Admin password (do this first)

Your unique admin password and session secret were generated into
`ADMIN_CREDENTIALS.local.txt` in the project folder (on your computer only — it is excluded from git).

Cloudflare dashboard → **Workers & Pages → raavi-volt → Settings → Variables and Secrets → Add**:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `ADMIN_PASSWORD` | from the file |
| Secret | `SESSION_SECRET` | from the file |

Save both in your password manager, then delete the file.

## 2. Deploy settings (Workers Builds)

| Setting | Value |
| --- | --- |
| Build command | `bunx opennextjs-cloudflare build` |
| Deploy command | `bunx wrangler d1 migrations apply DB --remote && bunx opennextjs-cloudflare deploy` |
| Non-production branch command | `bunx opennextjs-cloudflare upload` |

Each push to `main` deploys. Migrations add the sample catalog (30 products) on the first deploy.

## 3. Connect amirstore.tech (turns on edge caching)

1. Cloudflare → **Add a domain** → `amirstore.tech` → Free plan → change the nameservers at your
   domain registrar to the two Cloudflare gives you (can take up to a few hours).
2. In `wrangler.jsonc`, uncomment the `routes` block, commit and push.
3. SSL/TLS → **Full (strict)**; Edge Certificates → **Always Use HTTPS: On**.

## 4. Free protection (Cloudflare dashboard, domain → Security)

- **Bot Fight Mode: On** (Security → Bots).
- **Rate limiting rule** (Security → WAF → Rate limiting rules — the free plan includes one):
  - *If* hostname equals `amirstore.tech` **and** URI path does not start with `/_next/`
  - *When* rate exceeds **120 requests per 10 seconds** from the same IP → **Block for 10 seconds**.
- **Browser Integrity Check: On** (Security → Settings).

These stop scrapers and floods before they reach the Worker, so they can't use up the daily free quota.

## 5. Monitoring (free)

- Add an HTTPS monitor for `https://amirstore.tech/api/health` in UptimeRobot (free, every 5 min).
  It returns `{"ok":true}` when the Worker and database are healthy.
- Cloudflare → Workers & Pages → raavi-volt → **Metrics / Logs** shows requests, errors and CPU.
- Cloudflare → D1 → raavi-volt-db → **Metrics** shows reads, writes and storage.

## Free-plan limits and what keeps you under them

| Limit (per day unless noted) | Free | How the store stays under |
| --- | --- | --- |
| Worker requests | 100,000 | Static files (JS, CSS, fonts, icons) are served by Workers Static Assets and **don't count**; the installed app / service worker serves repeat assets and images from the device; the WAF rule blocks floods |
| Worker CPU | 10 ms / request | Edge cache serves pages without rendering; cache is reset only on deploys and product changes |
| D1 reads | 5,000,000 | Edge cache hits need just one tiny read (catalog version, memoised 15 s) |
| D1 writes | 100,000 | Writes only on orders, admin edits, messages and rate-limit checks |
| D1 storage | 5 GB | Nightly job prunes logs older than 180 days; images are compressed to WebP before upload |
| Cron Triggers | 5 per account | 1 used (02:15 PKT nightly cleanup) |

On the free plan Cloudflare **never bills** — when a limit is reached, requests fail until the daily reset
(midnight UTC = 5 am PKT). Nothing in this project uses a paid product. Domain renewal and optional
paid WhatsApp templates are the only possible costs.

## Install as an app

Customers see **Install app** (header, menu, footer) on Android, Windows, macOS and ChromeOS in
Chrome / Edge / Samsung Internet, and step-by-step *Add to Home Screen* / *Add to Dock* instructions
on iPhone, iPad and Mac Safari. The app opens full-screen with shortcuts (Shop, Deals, Track, Cart),
loads repeat visits from the device, and shows a branded offline page without internet.

## After launch

- Replace the sample products with real ones in `/admin` (delete the samples there).
- Fill in bank / wallet accounts and QR images in `src/config/store.ts` → `paymentAccounts`.
- WhatsApp automation: follow `docs/WHATSAPP_SETUP.md` when ready.
