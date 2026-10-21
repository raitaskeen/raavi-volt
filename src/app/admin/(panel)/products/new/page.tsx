import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="Add product" description="Create a new listing with photos, price and specs." />
      <ProductForm />
    </>
  );
}
