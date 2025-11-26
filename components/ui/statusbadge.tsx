import React from "react";
import { cn } from "@/lib/utils";

type Status = string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusColors: Record<Status, string> = {
  "In Progress": "bg-progress text-primary-foreground",
  OK: "bg-submit text-primary-foreground",
  NOK: "bg-primary text-primary-foreground",
  "Need Input": "bg-gray-400 text-primary-foreground",
  "Waiting For Forum": "bg-progress text-primary-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "min-h-[48px] px-3 py-1 text-sm font-medium flex items-center justify-center rounded w-28",
        statusColors[status],
        className
      )}
    >
      {status}
    </span>
  );
}
