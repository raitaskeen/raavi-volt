"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border-0 !bg-matte !text-white !shadow-2xl",
          description: "!text-white/70",
          actionButton: "!bg-white !text-ink",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
