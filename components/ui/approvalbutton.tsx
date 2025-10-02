"use client";

import React from "react";
import { Button } from "@/components/ui/button";

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
    <div className="mt-3 px-4 md:px-5">
      {fileUploaded && (
        <div className="flex w-full gap-2 sm:w-auto sm:gap-4">
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("NOK")}
            variant="default"
            size="default"
            className="flex-1 sm:flex-none min-w-[200px]"
          >
            {disabled || loading ? "Memproses..." : "NOK"}
          </Button>
          <Button
            disabled={disabled || loading}
            onClick={() => onApprove("OK")}
            variant="submit"
            size="default"
            className="flex-1 sm:flex-none min-w-[200px]"
          >
            {disabled || loading ? "Memproses..." : "OK"}
          </Button>
        </div>
      )}
    </div>
  );
}
