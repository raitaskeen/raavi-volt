// Generates docs/WHATSAPP_SETUP.md from src/lib/whatsapp-templates.ts. Run: `bun run whatsapp:doc`
import { mkdirSync, writeFileSync } from "node:fs";
import { templates } from "../src/lib/whatsapp-templates";

const rows = Object.values(templates)
  .map((t) => {
    const examples = t.example.map((e, i) => `\`{{${i + 1}}}\` = ${e}`).join("<br>");
    return `### \`${t.name}\`\n\n- **Sent when:** ${t.when}\n- **To:** ${t.audience === "admin" ? "store owner (admin alert)" : "customer"}\n- **Category:** Utility · **Language:** English (\`en\`)\n\n**Body** (copy exactly):\n\n\`\`\`text\n${t.body}\n\`\`\`\n\n**Sample values** (Meta asks for these when you submit):<br>${examples}\n`;
  })
  .join("\n");

const doc = `# WhatsApp — how it works and how to set it up

Raavi Volt talks to customers on WhatsApp through Meta's official **WhatsApp Cloud API**.
It is built to run **free**: it only sends free messages unless you choose otherwise.

## The free rule (why this design)

WhatsApp lets a business send **free-form messages for free for 24 hours after the customer's
last message** (the *customer service window*). Messages a business starts outside that window
must be pre-approved **templates**, which Meta bills per message. So the store gets the customer
to message first, and does everything inside that free window.

## The customer journey

1. **Order placed** → the order page shows a big green **Get updates on WhatsApp** button.
2. Customer taps it → WhatsApp opens with *"Hi Raavi Volt! Please send me updates for order RV-…"* → they press send.
   *This opens the free 24 h window.*
3. The store replies **instantly** with the amount and bank / wallet details (+ your Raast QR image if set).
4. Customer **sends the payment screenshot in the same chat** (or types \`TID 123456789\`).
   The store downloads it, attaches it to the order as proof, and replies "payment received".
5. You confirm → "order confirmed" message. You ship → courier + tracking message. You deliver → thank-you.
   While the window is open, each of these is **free**.
6. Any time the customer writes ("any update?", their order number, or taps **Order status**),
   the assistant replies with the latest status — which also re-opens the free window.
7. Customer taps **Talk to a person** (or writes "agent", "call me"…) → the assistant goes quiet for 12 h
   and alerts you, so you can chat yourself.

**If the window has closed** when you update an order, \`whatsappConfig.outsideWindow\` decides:
- \`"skip"\` (default, free): nothing is sent; the admin order page shows a one-tap **Send manually**
  button, and the customer gets the latest status the next time they message.
- \`"template"\` (paid): the approved template is sent (a few rupees each — check Meta's Pakistan rate card).

## Run the store from WhatsApp (owner commands)

Set your **personal** WhatsApp as the admin number (secret \`WHATSAPP_ADMIN_NUMBER\`). It must be
a different number from the store number connected to the API. Message the store number:

| You send | What happens |
| --- | --- |
| \`orders\` | List of orders that need attention |
| \`status RV-XXXXXXXXXX\` | Order summary + admin link |
| \`confirm RV-XXXXXXXXXX\` | Marks paid & confirmed, messages the customer |
| \`ship RV-XXXXXXXXXX TCS 123456789\` | Marks shipped with courier + tracking, messages the customer |
| \`deliver RV-XXXXXXXXXX\` | Marks delivered, messages the customer |
| \`cancel RV-XXXXXXXXXX reason…\` | Cancels, restocks, tells the customer the reason |

The \`RV-\` prefix is optional and case doesn't matter. You also get alerts there for new orders,
payment screenshots and "talk to a person" requests — free whenever you've messaged the store number
in the last 24 h (sending \`orders\` each morning keeps your window open).

## Setup (≈ 30–45 minutes)

1. **Meta Business account** — <https://business.facebook.com> (business name, address; verification raises limits).
2. **Developer app** — <https://developers.facebook.com> → *Create app* → *Business* → add **WhatsApp**.
3. **Store phone number** — WhatsApp Manager → *Phone numbers* → add +92 301 4865252 (or a dedicated number).
   A number already on the WhatsApp app must be moved to the API, **or** use Meta's *coexistence*
   onboarding to keep using the WhatsApp Business app on the same number. Set display name **Raavi Volt**.
4. **Permanent token** — Business settings → *System users* → add an Admin system user → assign the app and
   WhatsApp account → *Generate token* with \`whatsapp_business_messaging\` + \`whatsapp_business_management\`, never expires.
5. **Webhook** — in the app: *WhatsApp → Configuration → Webhook*
   - Callback URL: \`https://amirstore.tech/api/whatsapp/webhook\`
   - Verify token: any random string — the same value you set as \`WHATSAPP_VERIFY_TOKEN\`
   - Subscribe to the **messages** field.
6. **Secrets** (Cloudflare):

   \`\`\`bash
   bunx wrangler secret put WHATSAPP_TOKEN            # system-user token
   bunx wrangler secret put WHATSAPP_PHONE_NUMBER_ID  # the *ID* under API Setup, not the number
   bunx wrangler secret put WHATSAPP_APP_SECRET       # App settings → Basic → App secret
   bunx wrangler secret put WHATSAPP_VERIFY_TOKEN     # same string as in step 5
   bunx wrangler secret put WHATSAPP_ADMIN_NUMBER     # your personal WhatsApp, e.g. 923001234567
   \`\`\`

7. **Templates** (only needed for the paid \`"template"\` mode or for alerts outside the window) — create the
   8 below in WhatsApp Manager → *Message templates*, category **Utility**, language **English**.
8. Place a test order, tap **Get updates on WhatsApp**, send a screenshot. The admin order page shows
   the chat window status and every message as *free*, *template*, *skipped*, *delivered* or *read*.

## Templates

${rows}
_Generated by \`bun run whatsapp:doc\` from \`src/lib/whatsapp-templates.ts\` — edit there, then regenerate._
`;

mkdirSync("docs", { recursive: true });
writeFileSync("docs/WHATSAPP_SETUP.md", doc);
console.log(`Wrote docs/WHATSAPP_SETUP.md (${Object.keys(templates).length} templates)`);
