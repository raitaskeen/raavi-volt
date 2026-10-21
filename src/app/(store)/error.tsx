"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-x grid min-h-[60dvh] place-items-center py-20 text-center">
      <div className="grid justify-items-center gap-4">
        <p className="eyebrow text-muted-foreground">Power cut</p>
        <h1 className="text-3xl">Something went wrong.</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Please try again. If it keeps happening, message us on WhatsApp{error.digest ? ` with code ${error.digest}` : ""}.
        </p>
        <div className="flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
