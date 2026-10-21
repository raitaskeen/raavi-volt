import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full min-w-0 rounded-md border border-input bg-card text-[15px] transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground/70 sm:text-sm focus-visible:border-charcoal focus-visible:ring-[3px] focus-visible:ring-ring/15 aria-invalid:border-ink aria-invalid:ring-[3px] aria-invalid:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-50";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "flex h-11 px-3.5 sm:h-10 file:mr-3 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export { Input, fieldBase };
