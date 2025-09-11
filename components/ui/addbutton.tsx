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
      className="bg-primary text-primary-foreground px-6 py-2 rounded-2xl font-semibold w-[183px] shadow-[1px_1px_6px_rgba(0,0,0,0.25)] hover:bg-red-700 text-xl"
    >
      {label}
    </button>
  );
}
