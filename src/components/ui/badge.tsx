import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        yellow: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        red: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
        blue: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
