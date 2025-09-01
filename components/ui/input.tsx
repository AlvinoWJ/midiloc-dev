import * as React from "react";

/**
 * A simple utility function to merge Tailwind CSS classes.
 * This replaces the external `cn` utility which was causing an import error.
 * @param {...(string|undefined|null|boolean)[]} classes - A list of classes to combine.
 * @returns {string} - A single string of combined class names.
 */
function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded border border-gray-300  bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
