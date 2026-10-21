"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { removeProduct } from "@/app/admin/(panel)/products/actions";

export function DeleteProductButton({ id, name, onDeleted, withLabel }: { id: string; name: string; onDeleted?: () => void; withLabel?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={withLabel ? "destructive" : "ghost"} size={withLabel ? "default" : "icon-sm"} aria-label={`Delete ${name}`} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          {withLabel && "Delete product"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this product?</AlertDialogTitle>
          <AlertDialogDescription>
            “{name}” and its images will be permanently removed from the store. Existing orders keep their copy of the item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                await removeProduct(id);
                toast("Product deleted", { description: name });
                onDeleted?.();
              })
            }
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
