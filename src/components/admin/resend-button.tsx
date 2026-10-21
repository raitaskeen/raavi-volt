"use client";

import { useActionState } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendOrderUpdate, type ResendState } from "@/app/admin/(panel)/orders/actions";

export function ResendButton({ code }: { code: string }) {
  const [state, action, pending] = useActionState<ResendState, FormData>(resendOrderUpdate.bind(null, code), null);
  return (
    <form action={action} className="grid gap-1.5">
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <RotateCw />} Resend via API
      </Button>
      {state && (
        <p role="status" className={`text-xs ${state.ok ? "text-ink" : "text-flame"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
