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
  "need input": "bg-[#d9d9d9] text-primary-foreground",
  "waiting for forum": "bg-red text-primary-foreground",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-3 py-1 text-sm font-medium text-center inline-block rounded w-28",
        statusColors[status],
        className
      )}
    >
      {status}
    </span>
  );
}
