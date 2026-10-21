import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { TrackForm } from "@/components/site/track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check payment and delivery status with your order number and phone.",
};

export default function TrackPage() {
  return (
    <div className="container-x grid max-w-xl justify-items-center py-14 text-center sm:py-20">
      <span className="grid size-14 place-items-center rounded-2xl bg-ink text-white">
        <PackageSearch className="size-6" strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 text-3xl sm:text-4xl">Track your order</h1>
      <p className="mt-2 text-muted-foreground">Enter the order number from your confirmation and the phone number you used at checkout.</p>
      <TrackForm />
    </div>
  );
}
