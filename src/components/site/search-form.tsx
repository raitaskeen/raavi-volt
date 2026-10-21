import Form from "next/form";
import { Search } from "lucide-react";

/** GET /shop?q=… with client-side navigation (next/form). */
export function SearchForm({ id = "q", className, defaultValue }: { id?: string; className?: string; defaultValue?: string }) {
  return (
    <Form action="/shop" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          defaultValue={defaultValue}
          placeholder="Search air fryers, fans, irons…"
          className="h-10 w-full rounded-full border border-input bg-card pr-4 pl-9 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-charcoal focus-visible:ring-[3px] focus-visible:ring-ring/15"
        />
      </div>
    </Form>
  );
}
