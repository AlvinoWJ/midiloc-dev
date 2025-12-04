import * as React from "react";

/**
 * Utility function: cn()
 * ----------------------
 * Menggabungkan beberapa className menjadi satu string.
 * - Hanya memasukkan nilai yang truthy (menghindari null / undefined / false)
 * - Berguna untuk kondisi dinamis pada className Tailwind
 */
function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Input Component
 * ---------------
 * Komponen input berbasis `<input />` menggunakan forwardRef
 * agar kompatibel dengan React Hook Form, focus handler, dll.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type} // tipe input (text, email, number, dll)
        className={cn(
          // Styling default input
          "flex h-11 w-full rounded border border-gray-300 bg-transparent px-3 py-1 text-base text-black font-medium shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground placeholder:text-base",
          "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className // class tambahan dari user
        )}
        ref={ref}
        {...props} // event, value, name, dll.
      />
    );
  }
);
Input.displayName = "Input";

/**
 * Textarea Component
 * ------------------
 * Komponen textarea berbasis `<textarea />` dengan forwardRef.
 * - Tinggi minimum diatur
 * - Resize dinonaktifkan agar konsisten dengan desain
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Styling default textarea
        "flex min-h-[80px] w-full rounded border border-gray-300 bg-transparent px-3 py-2 text-base text-black font-medium shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none", // nonaktifkan manual resize
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Input, Textarea };
