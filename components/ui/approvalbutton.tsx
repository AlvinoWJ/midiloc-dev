"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ApprovalStatusPanelProps {
  currentStatus: string | null;
  disabled: boolean;
  onApprove: (status: "OK" | "NOK") => void;
  show: boolean;
  fileUploaded: boolean;
  loading?: boolean;
}

export function ApprovalStatusbutton({
  disabled,
  onApprove,
  show,
  fileUploaded,
  loading = false,
}: ApprovalStatusPanelProps) {
  if (!show) return null;

  return (
    <div className="w-full px-2 md:px-0">
      {fileUploaded && (
        <div className="flex gap-3 w-full md:w-auto md:justify-end">
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("NOK")}
            variant="default"
            size="default"
            className="flex-1 md:flex-initial md:min-w-[180px] lg:min-w-[200px] h-10 md:h-10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "NOK"}
          </Button>
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("OK")}
            variant="submit"
            size="default"
            className="flex-1 md:flex-initial md:min-w-[180px] lg:min-w-[200px] h-10 md:h-10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "OK"}
          </Button>
        </div>
      )}
    </div>
  );
}
