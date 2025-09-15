// mobile-addbutton.tsx
interface MobileAddButtonProps {
  label?: string;
  onClick: () => void;
}

export default function MobileAddButton({
  label = "+ Add",
  onClick,
}: MobileAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:bg-red-700 transition-colors duration-200"
    >
      {label}
    </button>
  );
}
