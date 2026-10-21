"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Landmark, Loader2, Lock, ShoppingBag, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, Skeleton, fieldAria } from "@/components/ui/misc";
import { ProductImage } from "@/components/site/product-image";
import { placeOrder, type CheckoutState } from "@/app/(store)/checkout/actions";
import { cartSubtotal, useCart, useHydrated } from "@/lib/cart";
import { cities, lahoreAreas, paymentAccounts, shippingFor } from "@/config/store";
import { cn, formatPKR } from "@/lib/utils";

const SAVED_KEY = "rv-customer";
const SAVED_FIELDS = ["customerName", "phone", "email", "city", "area", "address", "postalCode"] as const;
type Saved = Partial<Record<(typeof SAVED_FIELDS)[number], string>>;

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3" aria-hidden>
        <span className="grid size-7 place-items-center rounded-full bg-ink font-mono text-xs text-white">{step}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </fieldset>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [state, formAction] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [pending, startTransition] = useTransition();
  const [city, setCity] = useState("Lahore");
  const [saved, setSaved] = useState<Saved | null>(null);

  // Returning customers: prefill details saved on this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Saved;
      setSaved(s);
      if (s.city && (cities as readonly string[]).includes(s.city)) setCity(s.city);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const errors = state && !state.ok ? (state.errors ?? {}) : {};

  useEffect(() => {
    if (state?.ok) {
      clear();
      router.replace(`/order/${state.code}?placed=1`);
    }
  }, [state, clear, router]);

  if (!hydrated) return <Skeleton className="h-[640px] w-full rounded-xl" />;

  if (lines.length === 0 && !state?.ok) {
    return (
      <div className="grid place-items-center gap-4 rounded-xl border border-dashed bg-card py-20 text-center">
        <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.25} />
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild>
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const delivery = shippingFor(city, subtotal);
  const total = subtotal + delivery;
  const busy = pending || state?.ok === true;

  return (
    <form
      key={saved ? "saved" : "new"}
      onSubmit={(e) => {
        // Submitting via a transition keeps typed values (no automatic form reset on error).
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        try {
          if (fd.get("remember")) {
            localStorage.setItem(SAVED_KEY, JSON.stringify(Object.fromEntries(SAVED_FIELDS.map((k) => [k, String(fd.get(k) ?? "")]))));
          } else localStorage.removeItem(SAVED_KEY);
        } catch {
          /* storage unavailable */
        }
        fd.set("lines", JSON.stringify(lines.map((l) => ({ productId: l.id, qty: l.qty }))));
        startTransition(() => formAction(fd));
      }}
      className="grid items-start gap-8 lg:grid-cols-[1fr_400px]"
    >
      <div className="grid gap-5">
        {state && !state.ok && state.message && (
          <div role="alert" className="rounded-lg border-2 border-flame bg-card px-4 py-3 text-sm font-medium">
            {state.message}
          </div>
        )}

        {saved?.customerName && (
          <p className="flex items-center gap-2 rounded-lg bg-volt/30 px-4 py-3 text-sm">
            Welcome back, <strong>{saved.customerName.split(" ")[0]}</strong> — we&apos;ve filled in your details.
          </p>
        )}

        <Section step="1" title="Contact">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="customerName" error={errors.customerName} className="sm:col-span-2">
              <Input {...fieldAria("customerName", errors.customerName)} autoComplete="name" required minLength={3} maxLength={80} placeholder="Ali Raza" defaultValue={saved?.customerName} />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="For delivery updates & payment confirmation">
              <Input
                {...fieldAria("phone", errors.phone, true)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                placeholder="0300-1234567"
                pattern="(\+?92|0)3\d{2}[\s\-]?\d{7}"
                title="Pakistani mobile number, e.g. 0300-1234567"
                maxLength={16}
                defaultValue={saved?.phone}
              />
            </Field>
            <Field label="Email" htmlFor="email" optional error={errors.email} hint="Optional — for order updates">
              <Input {...fieldAria("email", errors.email, true)} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" maxLength={120} defaultValue={saved?.email} />
            </Field>
          </div>
        </Section>

        <Section step="2" title="Delivery address">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" htmlFor="city" error={errors.city}>
              <NativeSelect {...fieldAria("city", errors.city)} autoComplete="address-level2" required value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={city === "Lahore" ? "Area / society" : "Area / town"} htmlFor="area" optional error={errors.area}>
              <Input
                {...fieldAria("area", errors.area)}
                list={city === "Lahore" ? "lahore-areas" : undefined}
                autoComplete="address-level3"
                placeholder={city === "Lahore" ? "e.g. Johar Town" : "Area"}
                maxLength={80}
                defaultValue={saved?.area}
              />
              <datalist id="lahore-areas">
                {lahoreAreas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
            <Field label="Complete address" htmlFor="address" error={errors.address} hint="House #, street, block, nearest landmark" className="sm:col-span-2">
              <Textarea
                {...fieldAria("address", errors.address, true)}
                autoComplete="street-address"
                required
                minLength={10}
                maxLength={300}
                rows={3}
                placeholder="House 12, Street 4, Block C…"
                defaultValue={saved?.address}
              />
            </Field>
            <Field label="Postal code" htmlFor="postalCode" optional error={errors.postalCode}>
              <Input
                {...fieldAria("postalCode", errors.postalCode)}
                inputMode="numeric"
                autoComplete="postal-code"
                pattern="\d{5}"
                maxLength={5}
                placeholder="54000"
                defaultValue={saved?.postalCode}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5 text-sm sm:col-span-1">
              <input type="checkbox" name="remember" defaultChecked className="size-4 accent-[var(--ink)]" />
              Save my details for next time
            </label>
          </div>
        </Section>

        <Section step="3" title="Payment — bank transfer / QR">
          <p className="-mt-2 text-sm text-muted-foreground">
            Choose where you&apos;ll send the payment. After placing the order you&apos;ll get the QR code and account details.
          </p>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-describedby={errors.paymentAccount ? "paymentAccount-error" : undefined}>
            {paymentAccounts.map((a, i) => {
              const wallet = !a.iban;
              const Icon = wallet ? Smartphone : Landmark;
              return (
                <label
                  key={a.id}
                  className="group relative flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 transition-colors has-[:checked]:border-ink has-[:checked]:bg-volt/20 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/20"
                >
                  <input type="radio" name="paymentAccount" value={a.id} defaultChecked={i === 0} required className="peer sr-only" />
                  <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                  <span className="grid">
                    <span className="text-sm font-medium">{a.bank}</span>
                    <span className="text-xs text-muted-foreground">{wallet ? "Mobile wallet" : "Bank transfer / Raast"}</span>
                  </span>
                  <span className="ml-auto grid size-4 place-items-center rounded-full border border-input peer-checked:border-ink peer-checked:bg-ink">
                    <span className="size-1.5 rounded-full bg-white" />
                  </span>
                </label>
              );
            })}
          </div>
          {errors.paymentAccount && (
            <p id="paymentAccount-error" role="alert" className="text-xs font-medium">
              ↳ {errors.paymentAccount}
            </p>
          )}
          <Field label="Order notes" htmlFor="notes" optional error={errors.notes}>
            <Textarea {...fieldAria("notes", errors.notes)} rows={2} maxLength={500} placeholder="Preferred delivery time, gate instructions…" />
          </Field>
        </Section>
      </div>

      <aside className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="grid max-h-72 gap-3 overflow-y-auto">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <div className="relative w-14 shrink-0 overflow-hidden rounded-md border">
                <ProductImage src={l.image} alt={l.name} category={l.category} sizes="56px" />
                <span className="absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full bg-ink px-1 font-mono text-[10px] leading-4 text-white">
                  {l.qty}
                </span>
              </div>
              <span className="line-clamp-2 flex-1 text-sm">{l.name}</span>
              <span className="text-sm tabular-nums">{formatPKR(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid gap-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatPKR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery ({city})</dt>
            <dd className="tabular-nums">{delivery === 0 ? "Free" : formatPKR(delivery)}</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t pt-3">
            <dt className="font-medium">Total</dt>
            <dd className="text-xl font-semibold tabular-nums">{formatPKR(total)}</dd>
          </div>
        </dl>
        <Button type="submit" size="xl" variant="volt" disabled={busy} className={cn("w-full", busy && "cursor-wait")}>
          {busy ? <Loader2 className="animate-spin" /> : <Lock />}
          {busy ? "Placing order…" : `Place order · ${formatPKR(total)}`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Final prices and stock are confirmed on the server. You&apos;ll pay on the next screen.
        </p>
      </aside>
    </form>
  );
}
