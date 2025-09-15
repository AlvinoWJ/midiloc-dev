interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusStyle = () => {
    switch (status) {
      case "OK":
        return "bg-green-500 text-white";
      case "NOK":
        return "bg-red-500 text-white";
      case "In Progress":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-sm";
      default:
        return "px-3 py-1 text-xs";
    }
  };

  return (
    <span
      className={`rounded-full font-semibold ${getStatusStyle()} ${getSizeClass()}`}
    >
      {status}
    </span>
  );
}
