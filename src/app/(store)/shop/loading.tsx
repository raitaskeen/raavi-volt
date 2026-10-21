import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-x py-8 sm:py-12" aria-busy="true" aria-label="Loading products">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-4 w-32" />
      <Skeleton className="mt-8 mb-6 h-12 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border bg-card">
            <Skeleton className="aspect-square rounded-none" />
            <div className="grid gap-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
