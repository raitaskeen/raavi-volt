"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[50dvh] place-items-center text-center">
      <div className="grid justify-items-center gap-3">
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The action didn&apos;t complete. Nothing was lost — try again.{error.digest ? ` (code ${error.digest})` : ""}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
