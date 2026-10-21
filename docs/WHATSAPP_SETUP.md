# WhatsApp — how it works and how to set it up

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
4. Customer **sends the payment screenshot in the same chat** (or types `TID 123456789`).
   The store downloads it, attaches it to the order as proof, and replies "payment received".
5. You confirm → "order confirmed" message. You ship → courier + tracking message. You deliver → thank-you.
   While the window is open, each of these is **free**.
6. Any time the customer writes ("any update?", their order number, or taps **Order status**),
   the assistant replies with the latest status — which also re-opens the free window.
7. Customer taps **Talk to a person** (or writes "agent", "call me"…) → the assistant goes quiet for 12 h
   and alerts you, so you can chat yourself.

**If the window has closed** when you update an order, `whatsappConfig.outsideWindow` decides:
- `"skip"` (default, free): nothing is sent; the admin order page shows a one-tap **Send manually**
  button, and the customer gets the latest status the next time they message.
- `"template"` (paid): the approved template is sent (a few rupees each — check Meta's Pakistan rate card).

## Run the store from WhatsApp (owner commands)

Set your **personal** WhatsApp as the admin number (secret `WHATSAPP_ADMIN_NUMBER`). It must be
a different number from the store number connected to the API. Message the store number:

| You send | What happens |
| --- | --- |
| `orders` | List of orders that need attention |
| `status RV-XXXXXXXXXX` | Order summary + admin link |
| `confirm RV-XXXXXXXXXX` | Marks paid & confirmed, messages the customer |
| `ship RV-XXXXXXXXXX TCS 123456789` | Marks shipped with courier + tracking, messages the customer |
| `deliver RV-XXXXXXXXXX` | Marks delivered, messages the customer |
| `cancel RV-XXXXXXXXXX reason…` | Cancels, restocks, tells the customer the reason |

The `RV-` prefix is optional and case doesn't matter. You also get alerts there for new orders,
payment screenshots and "talk to a person" requests — free whenever you've messaged the store number
in the last 24 h (sending `orders` each morning keeps your window open).

## Setup (≈ 30–45 minutes)

1. **Meta Business account** — <https://business.facebook.com> (business name, address; verification raises limits).
2. **Developer app** — <https://developers.facebook.com> → *Create app* → *Business* → add **WhatsApp**.
3. **Store phone number** — WhatsApp Manager → *Phone numbers* → add +92 301 4865252 (or a dedicated number).
   A number already on the WhatsApp app must be moved to the API, **or** use Meta's *coexistence*
   onboarding to keep using the WhatsApp Business app on the same number. Set display name **Raavi Volt**.
4. **Permanent token** — Business settings → *System users* → add an Admin system user → assign the app and
   WhatsApp account → *Generate token* with `whatsapp_business_messaging` + `whatsapp_business_management`, never expires.
5. **Webhook** — in the app: *WhatsApp → Configuration → Webhook*
   - Callback URL: `https://amirstore.tech/api/whatsapp/webhook`
   - Verify token: any random string — the same value you set as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **messages** field.
6. **Secrets** (Cloudflare):

   ```bash
   bunx wrangler secret put WHATSAPP_TOKEN            # system-user token
   bunx wrangler secret put WHATSAPP_PHONE_NUMBER_ID  # the *ID* under API Setup, not the number
   bunx wrangler secret put WHATSAPP_APP_SECRET       # App settings → Basic → App secret
   bunx wrangler secret put WHATSAPP_VERIFY_TOKEN     # same string as in step 5
   bunx wrangler secret put WHATSAPP_ADMIN_NUMBER     # your personal WhatsApp, e.g. 923001234567
   ```

7. **Templates** (only needed for the paid `"template"` mode or for alerts outside the window) — create the
   8 below in WhatsApp Manager → *Message templates*, category **Utility**, language **English**.
8. Place a test order, tap **Get updates on WhatsApp**, send a screenshot. The admin order page shows
   the chat window status and every message as *free*, *template*, *skipped*, *delivered* or *read*.

## Templates

### `rv_order_placed`

- **Sent when:** Customer places an order
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Assalam o Alaikum {{1}}! Thank you for shopping with Raavi Volt. Your order {{2}} for Rs {{3}} has been placed. Please pay to {{4}} and submit your transaction ID here: {{5}} - We reserve your items for 72 hours.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = 18,499<br>`{{4}}` = Meezan Bank 0201 0000000000<br>`{{5}}` = https://amirstore.tech/order/RV-7K3M9QXA2T

### `rv_payment_received`

- **Sent when:** Customer submits payment details
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Hi {{1}}, we have received your payment details for order {{2}} (ref {{3}}). Our team is verifying it now and will confirm your order shortly.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = 0123456789

### `rv_order_confirmed`

- **Sent when:** Admin verifies the payment
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Good news {{1}}! Payment for order {{2}} is verified and your order is confirmed. We are packing it now. Track it here: {{3}} - Thank you for choosing Raavi Volt.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = https://amirstore.tech/order/RV-7K3M9QXA2T

### `rv_order_shipped`

- **Sent when:** Admin marks the order as shipped
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Hi {{1}}, your order {{2}} is on its way with {{3}} (tracking: {{4}}). Expected delivery {{5}}. Track it here: {{6}} - Please keep your phone on for the rider.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = TCS<br>`{{4}}` = 1234567890<br>`{{5}}` = within 24 hours<br>`{{6}}` = https://amirstore.tech/order/RV-7K3M9QXA2T

### `rv_order_delivered`

- **Sent when:** Admin marks the order as delivered
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Your order {{1}} has been delivered. We hope you love it, {{2}}! For warranty or after-sales help, just reply to this message. - Raavi Volt
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = RV-7K3M9QXA2T<br>`{{2}}` = Ali

### `rv_order_cancelled`

- **Sent when:** Order is cancelled (by admin or unpaid after 72 hours)
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Hi {{1}}, your order {{2}} has been cancelled. Reason: {{3}}. If this is a mistake or you would like to reorder, reply here and we will help.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = payment was not received within 72 hours

### `rv_contact_received`

- **Sent when:** Customer sends the contact form
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Hi {{1}}, thanks for contacting Raavi Volt about {{2}}. We have received your message and will reply here during business hours.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = Warranty / repair

### `rv_admin_alert`

- **Sent when:** New order, payment submitted, or new contact message (sent to the store owner)
- **To:** store owner (admin alert)
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Raavi Volt alert: {{1}}. Details: {{2}}. Open: {{3}} - sent automatically.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = New order RV-7K3M9QXA2T<br>`{{2}}` = Ali, Lahore, Rs 18,499<br>`{{3}}` = https://amirstore.tech/admin/orders/RV-7K3M9QXA2T

_Generated by `bun run whatsapp:doc` from `src/lib/whatsapp-templates.ts` — edit there, then regenerate._
