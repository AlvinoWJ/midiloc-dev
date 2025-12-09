import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * `badgeVariants`
 * ---------------
 * Utility untuk menghasilkan kelas Tailwind secara dinamis
 * menggunakan class-variance-authority (CVA).
 *
 * - Menyediakan beberapa variasi badge:
 *   - default
 *   - secondary
 *   - destructive
 *   - outline
 *
 * - Mengatur styling dasar seperti:
 *   - border, rounded-md
 *   - padding
 *   - font-size
 *   - transition & state focus
 *
 * Penggunaan:
 * badgeVariants({ variant: "secondary" })
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * BadgeProps
 * ----------
 * Props untuk komponen Badge.
 *
 * Terdiri dari:
 * - HTMLAttributes untuk elemen div
 * - VariantProps dari CVA untuk property `variant`
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge Component
 * ---------------
 * Komponen kecil untuk memberikan highlight / label pada UI.
 *
 * Contoh penggunaan:
 * <Badge>Active</Badge>
 * <Badge variant="secondary">Draft</Badge>
 * <Badge variant="destructive">Removed</Badge>
 *
 * Props:
 * - variant: default | secondary | destructive | outline
 * - className: override tambahan untuk styling eksternal
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      // Merge kelas hasil CVA dengan className tambahan
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
