"use client";

interface AddButtonProps {
  label?: string;
  onClick?: () => void;
}

export default function AddButton({
  label = "+ Add",
  onClick,
}: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        w-full bg-primary text-primary-foreground py-3 px-6 rounded-xl font-semibold shadow-md 
        md:w-[183px] md:py-2 md:rounded-2xl md:text-xl md:shadow-[1px_1px_6px_rgba(0,0,0,0.25)]
        hover:bg-red-700 transition-colors duration-200
      "
    >
      {label}
    </button>
  );
}
