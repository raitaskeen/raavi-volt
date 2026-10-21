import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60dvh] place-items-center py-20 text-center">
      <div className="grid justify-items-center gap-4">
        <p className="font-mono text-7xl font-semibold tracking-tighter">404</p>
        <h1 className="text-xl font-semibold">This page tripped the breaker.</h1>
        <p className="max-w-sm text-sm text-muted-foreground">The product or page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/shop">Browse products</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
