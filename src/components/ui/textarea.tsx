import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "@/components/ui/input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldBase, "flex min-h-24 px-3.5 py-2.5", className)} {...props} />;
}

export { Textarea };
