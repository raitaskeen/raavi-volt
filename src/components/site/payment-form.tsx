"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldAria } from "@/components/ui/misc";
import { submitPaymentAction, type PaymentState } from "@/app/(store)/checkout/actions";
import { compressImage } from "@/lib/image-client";

export function PaymentForm({ code, defaultRef, defaultPayer }: { code: string; defaultRef?: string; defaultPayer?: string }) {
  const [state, formAction] = useActionState<PaymentState, FormData>(submitPaymentAction, null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const errors = state && !state.ok ? (state.errors ?? {}) : {};

  if (state?.ok) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-ink bg-card p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Payment details received</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We&apos;ll verify the transfer and confirm your order by SMS / WhatsApp, usually within an hour during business hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = fd.get("proof");
        if (file instanceof File && file.size > 0) fd.set("proof", await compressImage(file, 1600, 0.8));
        startTransition(() => formAction(fd));
      }}
      className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6"
    >
      <input type="hidden" name="code" value={code} />
      <div>
        <h3 className="font-semibold">Already paid? Tell us</h3>
        <p className="mt-1 text-sm text-muted-foreground">Submit your transaction details so we can match your payment quickly.</p>
      </div>
      {state && !state.ok && state.message && (
        <p role="alert" className="rounded-md border border-ink px-3 py-2 text-sm font-medium">
          {state.message}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Transaction / reference ID" htmlFor="paymentRef" error={errors.paymentRef} hint="Shown on your bank app receipt">
          <Input
            {...fieldAria("paymentRef", errors.paymentRef, true)}
            required
            minLength={4}
            maxLength={64}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            defaultValue={defaultRef}
            placeholder="e.g. 0123456789"
          />
        </Field>
        <Field label="Paid from (account holder)" htmlFor="paymentPayer" error={errors.paymentPayer}>
          <Input
            {...fieldAria("paymentPayer", errors.paymentPayer)}
            required
            minLength={3}
            maxLength={80}
            autoComplete="name"
            defaultValue={defaultPayer}
            placeholder="Name on the sending account"
          />
        </Field>
      </div>
      <Field label="Payment screenshot" htmlFor="proof" optional error={errors.proof} hint="JPG, PNG or WebP · up to 5 MB">
        <label
          htmlFor="proof"
          className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed bg-paper p-4 transition-colors hover:border-charcoal/50"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Selected payment screenshot" className="size-16 rounded-md border object-cover" />
          ) : (
            <span className="grid size-16 place-items-center rounded-md border bg-card">
              <ImagePlus className="size-5" strokeWidth={1.5} />
            </span>
          )}
          <span className="text-sm">
            <span className="font-medium">{preview ? "Change screenshot" : "Upload screenshot"}</span>
            <span className="block text-xs text-muted-foreground">Tap to choose from your gallery</span>
          </span>
          <input
            {...fieldAria("proof", errors.proof, true)}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview((old) => {
                if (old) URL.revokeObjectURL(old);
                return f ? URL.createObjectURL(f) : null;
              });
            }}
          />
        </label>
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Submitting…" : "Submit payment details"}
      </Button>
    </form>
  );
}
