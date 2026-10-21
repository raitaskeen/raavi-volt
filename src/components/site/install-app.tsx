"use client";

import { useState } from "react";
import { Download, MonitorDown, PlusSquare, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { promptInstall, useInstallMode } from "@/lib/install";
import { store } from "@/config/store";
import { cn } from "@/lib/utils";

const steps = {
  ios: [
    { icon: Share, text: "Tap the Share button in Safari's toolbar" },
    { icon: PlusSquare, text: "Scroll and tap “Add to Home Screen”" },
    { icon: Smartphone, text: `Tap “Add” — ${store.name} opens like an app` },
  ],
  "mac-safari": [
    { icon: Share, text: "In Safari's menu bar, open File (or the Share button)" },
    { icon: MonitorDown, text: "Choose “Add to Dock”" },
    { icon: Smartphone, text: `Click “Add” — ${store.name} opens from your Dock` },
  ],
} as const;

/**
 * "Install app" — native prompt on Android / Windows / macOS Chrome & Edge /
 * ChromeOS; step-by-step guide on iPhone, iPad and Mac Safari. Hidden when the
 * app is already installed or the browser can't install it.
 */
export function InstallApp({ variant = "header", className }: { variant?: "header" | "row"; className?: string }) {
  const mode = useInstallMode();
  const [guideOpen, setGuideOpen] = useState(false);
  if (!mode) return null;

  const onClick = async () => {
    if (mode === "prompt") {
      if (await promptInstall()) toast(`${store.name} installed`, { description: "Find it on your home screen or app list." });
    } else setGuideOpen(true);
  };

  return (
    <>
      {variant === "header" ? (
        <Button variant="ghost" size="sm" onClick={onClick} className={cn("gap-1.5 rounded-full px-2.5", className)} aria-label="Install the Raavi Volt app">
          <Download className="size-4" />
          <span className="hidden sm:inline">Install app</span>
        </Button>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className={cn("flex w-full items-center gap-3 rounded-md bg-volt px-3 py-3 text-left text-[15px] font-medium text-ink", className)}
        >
          <Download className="size-5" />
          <span className="flex-1">
            Install the app
            <span className="block text-xs font-normal text-ink/70">Faster, works offline, one tap from your home screen</span>
          </span>
        </button>
      )}

      {mode !== "prompt" && (
        <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
          <SheetContent side="bottom" className="mx-auto max-w-lg">
            <SheetHeader>
              <SheetTitle>Install {store.name}</SheetTitle>
              <SheetDescription>Three quick steps — no app store needed.</SheetDescription>
            </SheetHeader>
            <ol className="grid gap-3 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {steps[mode].map(({ icon: Icon, text }, i) => (
                <li key={text} className="flex items-center gap-4 rounded-lg bg-paper p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs text-volt">{i + 1}</span>
                  <span className="flex-1 text-sm">{text}</span>
                  <Icon className="size-5 shrink-0 text-charcoal" />
                </li>
              ))}
            </ol>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
