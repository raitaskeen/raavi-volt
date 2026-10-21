"use client";

import { useActionState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldAria } from "@/components/ui/misc";
import { trackOrder, type TrackState } from "@/app/(store)/track/actions";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, null);
  const errors = state?.errors ?? {};

  return (
    <form action={action} className="mt-8 grid w-full gap-5 rounded-xl border bg-card p-5 text-left sm:p-6">
      {state?.message && (
        <p role="alert" className="rounded-md border border-ink px-3 py-2 text-sm font-medium">
          {state.message}
        </p>
      )}
      <Field label="Order number" htmlFor="code" error={errors.code} hint="e.g. RV-7K3M9QXA2T">
        <Input
          {...fieldAria("code", errors.code, true)}
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          placeholder="RV-XXXXXXXXXX"
          className="font-mono uppercase"
        />
      </Field>
      <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
        <Input {...fieldAria("phone", errors.phone)} type="tel" inputMode="tel" autoComplete="tel" required maxLength={16} placeholder="0300-1234567" />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Search />}
        Find my order
      </Button>
    </form>
  );
}
