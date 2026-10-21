"use client";

import { useSyncExternalStore } from "react";

/** Chrome / Edge / Samsung Internet install prompt event. */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Listen as soon as this module loads — the event can fire before React mounts.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export type InstallMode = "prompt" | "ios" | "mac-safari" | null;

function detect(): InstallMode {
  if (installed) return null;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  if (standalone) return null;
  if (deferred) return "prompt";
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  const safari = /^((?!chrome|chromium|crios|fxios|edg|android).)*safari/i.test(ua);
  if (safari && /macintosh/i.test(ua)) return "mac-safari";
  return null;
}

/** How (and whether) this device can install the store as an app. */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    detect,
    () => null,
  );
}

/** Shows the native prompt. Returns true if the user accepted. */
export async function promptInstall() {
  if (!deferred) return false;
  const e = deferred;
  deferred = null;
  emit();
  await e.prompt();
  const choice = await e.userChoice.catch(() => ({ outcome: "dismissed" as const }));
  return choice.outcome === "accepted";
}
