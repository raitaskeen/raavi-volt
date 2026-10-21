"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { Toaster } from "@/components/ui/sonner";

/** LazyMotion keeps the animation bundle tiny (~15kb) by loading only DOM features. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
        {children}
        <Toaster />
      </MotionConfig>
    </LazyMotion>
  );
}
