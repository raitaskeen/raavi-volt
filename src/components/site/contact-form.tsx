"use client";

import { useActionState, useTransition } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldAria } from "@/components/ui/misc";
import { WhatsAppIcon } from "@/components/site/icons";
import { sendContactMessage, type ContactState } from "@/app/(store)/contact/actions";
import { contactTopics } from "@/config/store";

export function ContactForm() {
  const [state, action] = useActionState<ContactState, FormData>(sendContactMessage, null);
  const [pending, startTransition] = useTransition();
  const errors = state && !state.ok ? (state.errors ?? {}) : {};

  if (state?.ok) {
    return (
      <div role="status" className="flex items-start gap-4 rounded-xl border-2 border-ink bg-volt/30 p-6">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0" />
        <div>
          <p className="font-display text-xl">Thanks, {state.name} — message received.</p>
          <p className="mt-1 text-sm text-charcoal">
            {state.optIn ? "We've sent a confirmation to your WhatsApp and will reply there during business hours." : "We'll get back to you during business hours."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="relative grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-6"
    >
      <div className="sm:col-span-2">
        <h2 className="text-xl">Send us a message</h2>
        <p className="mt-1 text-sm text-muted-foreground">We usually reply within an hour during business hours.</p>
      </div>
      {state && !state.ok && state.message && (
        <p role="alert" className="rounded-lg border-2 border-flame px-3 py-2 text-sm font-medium sm:col-span-2">
          {state.message}
        </p>
      )}
      {/* Honeypot for bots — hidden from people and assistive tech. */}
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden>
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <Field label="Your name" htmlFor="name" error={errors.name}>
        <Input {...fieldAria("name", errors.name)} autoComplete="name" required minLength={2} maxLength={80} placeholder="Ali Raza" />
      </Field>
      <Field label="WhatsApp / mobile" htmlFor="phone" error={errors.phone}>
        <Input
          {...fieldAria("phone", errors.phone)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={16}
          placeholder="0300-1234567"
          pattern="(\+?92|0)3\d{2}[\s\-]?\d{7}"
          title="Pakistani mobile number, e.g. 0300-1234567"
        />
      </Field>
      <Field label="Topic" htmlFor="topic" error={errors.topic}>
        <NativeSelect {...fieldAria("topic", errors.topic)} required defaultValue="">
          <option value="" disabled>
            Choose a topic
          </option>
          {contactTopics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Order number" htmlFor="orderCode" optional error={errors.orderCode}>
        <Input {...fieldAria("orderCode", errors.orderCode)} autoComplete="off" spellCheck={false} maxLength={16} placeholder="RV-XXXXXXXXXX" className="font-mono uppercase" />
      </Field>
      <Field label="Email" htmlFor="email" optional error={errors.email} className="sm:col-span-2">
        <Input {...fieldAria("email", errors.email)} type="email" inputMode="email" autoComplete="email" maxLength={120} placeholder="you@example.com" />
      </Field>
      <Field label="Message" htmlFor="body" error={errors.body} className="sm:col-span-2">
        <Textarea {...fieldAria("body", errors.body)} required minLength={10} maxLength={2000} rows={5} placeholder="How can we help?" />
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2">
        <input type="checkbox" name="whatsappOptIn" defaultChecked className="size-4 accent-[#25d366]" />
        <WhatsAppIcon className="size-4 text-[#1da851]" /> Reply to me on WhatsApp
      </label>
      <Button type="submit" size="lg" variant="volt" disabled={pending} className="sm:col-span-2 sm:w-fit">
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
