import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { getProductById } from "@/lib/products";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await getProductById((await params).id);
  if (!product) notFound();
  return (
    <>
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm product={product} />
    </>
  );
}
