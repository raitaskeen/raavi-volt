"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Field, fieldAria } from "@/components/ui/misc";
import { ImageUploader } from "@/components/admin/image-uploader";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { saveProduct, type ProductFormState } from "@/app/admin/(panel)/products/actions";
import { brands, categories } from "@/config/store";
import type { Product, Spec } from "@/lib/products";
import { slugify } from "@/lib/utils";

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-input transition-colors peer-checked:bg-ink peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/25 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const action = saveProduct.bind(null, product?.id ?? null);
  const [state, formAction] = useActionState<ProductFormState, FormData>(action, null);
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [specs, setSpecs] = useState<Spec[]>(product?.specs.length ? product.specs : [{ label: "", value: "" }]);
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const errors = state?.errors ?? {};

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("images", JSON.stringify(images));
        fd.set("specs", JSON.stringify(specs));
        startTransition(() => formAction(fd));
      }}
      className="grid items-start gap-6 xl:grid-cols-[1fr_340px]"
    >
      <div className="grid gap-6">
        {state?.message && (
          <p role="alert" className="rounded-lg border border-ink bg-card px-4 py-3 text-sm font-medium">
            {state.message}
          </p>
        )}

        <Card title="Basics">
          <Field label="Product name" htmlFor="name" error={errors.name}>
            <Input
              {...fieldAria("name", errors.name)}
              required
              minLength={3}
              maxLength={120}
              defaultValue={product?.name}
              placeholder="Geepas 4.5L Digital Air Fryer"
              onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
            />
          </Field>
          <Field label="URL slug" htmlFor="slug" error={errors.slug} hint={`/product/${slug || "…"}`}>
            <Input
              {...fieldAria("slug", errors.slug, true)}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              maxLength={80}
              spellCheck={false}
              autoCapitalize="none"
            />
          </Field>
          <Field label="Short description" htmlFor="shortDesc" optional error={errors.shortDesc} hint="One line shown under the title (max 200)">
            <Input {...fieldAria("shortDesc", errors.shortDesc, true)} maxLength={200} defaultValue={product?.shortDesc} />
          </Field>
          <Field label="Full description" htmlFor="description" optional error={errors.description}>
            <Textarea {...fieldAria("description", errors.description)} rows={6} maxLength={5000} defaultValue={product?.description} />
          </Field>
        </Card>

        <Card title="Images" description="Clean product shots on white look best.">
          <ImageUploader value={images} onChange={setImages} />
          {errors.images && (
            <p role="alert" className="text-xs font-medium">
              ↳ {errors.images}
            </p>
          )}
        </Card>

        <Card title="Pricing & inventory">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Price (PKR)" htmlFor="price" error={errors.price}>
              <Input {...fieldAria("price", errors.price)} type="number" inputMode="numeric" min={1} step={1} required defaultValue={product?.price} placeholder="18499" />
            </Field>
            <Field label="Compare-at (PKR)" htmlFor="compareAt" optional error={errors.compareAt} hint="Shows as a strikethrough">
              <Input {...fieldAria("compareAt", errors.compareAt, true)} type="number" inputMode="numeric" min={0} step={1} defaultValue={product?.compareAt ?? ""} />
            </Field>
            <Field label="Stock" htmlFor="stock" error={errors.stock}>
              <Input {...fieldAria("stock", errors.stock)} type="number" inputMode="numeric" min={0} step={1} required defaultValue={product?.stock ?? 0} />
            </Field>
            <Field label="SKU" htmlFor="sku" optional error={errors.sku}>
              <Input {...fieldAria("sku", errors.sku)} maxLength={40} defaultValue={product?.sku ?? ""} spellCheck={false} />
            </Field>
            <Field label="Warranty" htmlFor="warranty" optional error={errors.warranty} className="sm:col-span-2">
              <Input {...fieldAria("warranty", errors.warranty)} maxLength={80} defaultValue={product?.warranty ?? "1 year brand warranty"} />
            </Field>
          </div>
        </Card>

        <Card title="Specifications" description="Key facts shown as a table on the product page.">
          <div className="grid gap-3">
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
                <Input
                  aria-label={`Spec ${i + 1} label`}
                  placeholder="e.g. Power"
                  value={s.label}
                  maxLength={60}
                  onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <Input
                  aria-label={`Spec ${i + 1} value`}
                  placeholder="e.g. 1500 W"
                  value={s.value}
                  maxLength={160}
                  onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setSpecs(specs.filter((_, j) => j !== i))} aria-label={`Remove spec ${i + 1}`}>
                  <X />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setSpecs([...specs, { label: "", value: "" }])} disabled={specs.length >= 30}>
              <Plus /> Add spec
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:sticky xl:top-10">
        <Card title="Organisation">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <NativeSelect {...fieldAria("category", errors.category)} required defaultValue={product?.category ?? ""}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.long}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Brand" htmlFor="brand" error={errors.brand}>
            <Input {...fieldAria("brand", errors.brand)} list="brand-list" required maxLength={40} defaultValue={product?.brand ?? "Geepas"} />
            <datalist id="brand-list">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
        </Card>

        <Card title="Visibility">
          <Toggle name="active" label="Live on store" description="Hidden products can't be bought" defaultChecked={product?.active ?? true} />
          <Toggle name="featured" label="Featured" description="Show in Best sellers on the home page" defaultChecked={product?.featured ?? false} />
        </Card>

        <div className="grid gap-2">
          <Button type="submit" size="lg" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {product ? "Save changes" : "Create product"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/products">Cancel</Link>
          </Button>
          {product && (
            <>
              <Button asChild variant="outline">
                <Link href={`/product/${product.slug}`} target="_blank">
                  View on store
                </Link>
              </Button>
              <DeleteProductButton id={product.id} name={product.name} withLabel onDeleted={() => router.push("/admin/products")} />
            </>
          )}
        </div>
      </div>
    </form>
  );
}
