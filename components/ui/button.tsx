import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * buttonVariants: Konfigurasi gaya menggunakan 'class-variance-authority'.
 * Ini memungkinkan pembuatan variasi tombol (seperti 'primary', 'ghost', 'size')
 * hanya dengan menggunakan props.
 */
const buttonVariants = cva(
  // --- BASE STYLES ---
  // Gaya dasar yang diterapkan ke SEMUA tombol (flexbox, focus states, disabled states, svg sizing)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // --- VISUAL VARIANTS ---
      // Mengatur warna background, text, border, dan shadow
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:brightness-110 transition-all rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        back:
          // Varian khusus tombol 'Kembali' (Bordered/Outlined style)
          "border-2 border-primary bg-background shadow hover:text-accent-foreground hover:bg-primary hover:border-transparent text-primary rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground shadow hover:brightness-110 transition-all rounded-xl",
        ghost: "bg-gray-200 hover:bg-gray-300", // Gaya subtle tanpa background kuat
        link: "text-primary underline-offset-4 hover:underline", // Gaya seperti hyperlink
        submit:
          // Varian khusus untuk aksi Submit (biasanya hijau)
          "bg-green-600 text-submit-foreground shadow rounded-xl hover:brightness-110 transition-all",
      },
      // --- SIZE VARIANTS ---
      // Mengatur padding dan ukuran font
      size: {
        default: "h-10 px-4 py-4 text-md",
        sm: "h-8 rounded-md px-3 text-sm",
        lg: "h-10 lg:h-11 px-8 py-4 text-base lg:text-lg",
        icon: "h-9 w-9", // Ukuran kotak untuk tombol yang hanya berisi icon
      },
    },
    // --- DEFAULT PROPS ---
    // Jika props tidak diberikan, gunakan nilai ini
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Interface Props Button.
 * Menggabungkan atribut HTML button standar (onClick, type, dll)
 * dengan varian dari CVA (variant, size).
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Jika true, komponen akan merender sebagai `Slot` (Radix UI).
   * Ini berguna untuk menggabungkan props Button ke elemen child-nya.
   * Contoh: <Button asChild><Link href="/">Home</Link></Button>
   * (Akan merender <a> dengan gaya tombol, bukan <button> di dalam <a>)
   */
  asChild?: boolean;
}

/**
 * Komponen Button Utama.
 * Menggunakan forwardRef agar parent component bisa mengakses DOM node button.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Tentukan elemen yang akan dirender: 'Slot' (jika asChild=true) atau 'button' biasa
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        // Menggabungkan class dari CVA dan className custom (jika ada) menggunakan `cn` (clsx + tailwind-merge)
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
