import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-x py-6 sm:py-10" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-6 h-3 w-48" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="grid content-start gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-4 h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
