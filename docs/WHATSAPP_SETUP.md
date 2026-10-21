# WhatsApp notifications — setup

Raavi Volt sends WhatsApp messages automatically at every order stage and for the contact form,
using Meta's official **WhatsApp Cloud API**. Until it's connected, every message is logged as
*skipped* in the admin and you can send it in one tap with **Send manually** on the order page.

## What gets sent

| Event | Customer gets | You (store owner) get |
| --- | --- | --- |
| Order placed | `rv_order_placed` — amount, account to pay, order link | `rv_admin_alert` — new order |
| Payment details submitted | `rv_payment_received` | `rv_admin_alert` — payment to verify |
| Admin confirms payment | `rv_order_confirmed` | — |
| Admin marks shipped (courier + tracking) | `rv_order_shipped` | — |
| Admin marks delivered | `rv_order_delivered` | — |
| Cancelled by admin / unpaid after 72 h | `rv_order_cancelled` with reason | — |
| Contact form message | `rv_contact_received` | `rv_admin_alert` — new message |

Customers only get messages if they ticked **“Get order updates on WhatsApp”** at checkout
(or **“Reply to me on WhatsApp”** on the contact form) — WhatsApp policy requires this opt-in.
Admins can skip any single update with **“Don't send the customer a WhatsApp update”**.

## One-time setup (≈ 30 minutes + template approval)

1. **Meta Business account** — create/verify one at <https://business.facebook.com>
   (business name, address, and ideally your NTN / business documents for verification).
2. **Developer app** — at <https://developers.facebook.com> → *Create app* → type *Business* →
   add the **WhatsApp** product and link your Business account.
3. **Phone number** — WhatsApp Manager → *Phone numbers* → *Add*. Use a dedicated number for the
   API (a number currently on the WhatsApp **app** must be removed from it first, unless you use
   Meta's *coexistence* onboarding for the WhatsApp Business app). Verify it by SMS / call and set
   the display name **Raavi Volt**.
4. **Permanent token** — Business settings → *System users* → add an *Admin* system user →
   *Assign assets* (your app + WhatsApp account) → *Generate token* with the
   `whatsapp_business_messaging` and `whatsapp_business_management` permissions, *never expires*.
5. **Payment method** — WhatsApp Manager → add a card. Pakistan utility messages are billed per
   delivered message (check Meta's current rate card).
6. **Templates** — WhatsApp Manager → *Message templates* → *Create* each template below with the
   exact name, category **Utility**, language **English**, and body text. Approval is usually minutes.
7. **Connect the store** (Cloudflare):

   ```bash
   bunx wrangler secret put WHATSAPP_TOKEN            # the system-user token
   bunx wrangler secret put WHATSAPP_PHONE_NUMBER_ID  # the *ID* shown under API Setup, not the number
   ```

   For local testing, add the same two lines to `.dev.vars`.
8. Set **`whatsappConfig.adminNumber`** / **`store.contact.whatsapp`** in `src/config/store.ts`
   to the number that should receive admin alerts (digits only, e.g. `923001234567`).
9. Place a test order — the admin dashboard shows **WhatsApp updates: Connected** and each order
   page lists every message as *sent*, *failed* (with Meta's error) or *skipped*.

> Customer **replies** arrive in WhatsApp Manager / your connected inbox, not in this admin.

## Templates

### `rv_order_placed`

- **Sent when:** Customer places an order
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Assalam o Alaikum {{1}}! Thank you for shopping with Raavi Volt. Your order {{2}} for Rs {{3}} has been placed. Please pay to {{4}} and submit your transaction ID here: {{5}} - We reserve your items for 72 hours.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = 18,499<br>`{{4}}` = Meezan Bank 0201 0000000000<br>`{{5}}` = https://raavivolt.pk/order/RV-7K3M9QXA2T

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

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = https://raavivolt.pk/order/RV-7K3M9QXA2T

### `rv_order_shipped`

- **Sent when:** Admin marks the order as shipped
- **To:** customer
- **Category:** Utility · **Language:** English (`en`)

**Body** (copy exactly):

```text
Hi {{1}}, your order {{2}} is on its way with {{3}} (tracking: {{4}}). Expected delivery {{5}}. Track it here: {{6}} - Please keep your phone on for the rider.
```

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = Ali<br>`{{2}}` = RV-7K3M9QXA2T<br>`{{3}}` = TCS<br>`{{4}}` = 1234567890<br>`{{5}}` = within 24 hours<br>`{{6}}` = https://raavivolt.pk/order/RV-7K3M9QXA2T

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

**Sample values** (Meta asks for these when you submit):<br>`{{1}}` = New order RV-7K3M9QXA2T<br>`{{2}}` = Ali, Lahore, Rs 18,499<br>`{{3}}` = https://raavivolt.pk/admin/orders/RV-7K3M9QXA2T

_Generated by `bun run whatsapp:doc` from `src/lib/whatsapp-templates.ts` — edit there, then regenerate._
