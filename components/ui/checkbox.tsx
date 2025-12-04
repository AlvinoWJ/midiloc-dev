"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Komponen Checkbox Kustom.
 * Menggunakan React.forwardRef untuk memungkinkan integrasi dengan form library (seperti React Hook Form).
 *
 * Struktur:
 * - Root: Kotak luar (border, background).
 * - Indicator: Kontainer dalam yang hanya muncul saat checked.
 * - Icon: Ikon centang visual.
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // --- Base Layout & Sizing ---
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow",

      // --- Focus States (Accessibility) ---
      // Menangani tampilan outline saat navigasi menggunakan keyboard (Tab)
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",

      // --- Disabled State ---
      "disabled:cursor-not-allowed disabled:opacity-50",

      // --- Checked State (PENTING) ---
      // Radix UI menambahkan atribut 'data-state="checked"' atau "unchecked".
      // Tailwind menargetkan atribut ini untuk mengubah warna background & text.
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",

      className
    )}
    {...props}
  >
    {/* Indicator: Komponen ini secara otomatis mengatur visibilitasnya sendiri.
      Hanya akan me-render children-nya (Ikon Check) jika state = checked atau indeterminate.
    */}
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
