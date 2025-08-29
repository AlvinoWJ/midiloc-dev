import React from "react";
import { cn } from "@/lib/utils";

type Status = "In Progress" | "OK" | "NOK";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusColors: Record<Status, string> = {
  "In Progress": "bg-yellow-400 text-black",
  OK: "bg-green-500 text-white",
  NOK: "bg-red-500 text-white",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-3 py-1 text-sm font-medium rounded",
        statusColors[status],
        className
      )}
    >
      {status}
    </span>
  );
}
