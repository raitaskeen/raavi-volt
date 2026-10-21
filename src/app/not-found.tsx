import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function RootNotFound() {
  return (
    <main className="grid-paper grid min-h-dvh place-items-center p-6 text-center">
      <div className="grid justify-items-center gap-4">
        <Logo />
        <p className="font-display mt-6 text-7xl">404</p>
        <h1 className="text-xl">Page not found</h1>
        <Button asChild>
          <Link href="/">Back to store</Link>
        </Button>
      </div>
    </main>
  );
}
