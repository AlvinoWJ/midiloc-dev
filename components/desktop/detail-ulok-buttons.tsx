"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ApprovalStatusbutton } from "@/components/ui/approvalbutton"; // Pastikan path benar

interface DetailActionButtonsProps {
  // Otorisasi & Kondisi
  isLocationSpecialist: boolean;
  isLocationManager: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  isApproving: boolean;
  isIntipDone: boolean;
  isPendingApproval: boolean;
  currentStatus: string;

  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onOpenIntipForm: () => void;
  onApprove: (status: "OK" | "NOK") => void;
}

export default function DetailActionButtons({
  isLocationSpecialist,
  isLocationManager,
  isEditing,
  isSubmitting,
  isApproving,
  isIntipDone,
  isPendingApproval,
  currentStatus,
  onEdit,
  onSave,
  onCancel,
  onOpenIntipForm,
  onApprove,
}: DetailActionButtonsProps) {
  const router = useRouter();
  return (
    <div className="flex justify-between items-center mb-6">
      <Button onClick={() => router.back()} className="rounded-full w-20 h-10">
        Back
      </Button>

      <div className="flex gap-3">
        {/* Tombol Aksi untuk Location Specialist */}
        {isLocationSpecialist && isPendingApproval && (
          <>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="rounded-full px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSave}
                  disabled={isSubmitting}
                  className="bg-submit hover:bg-green-600 text-white rounded-full px-6"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                onClick={onEdit}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-2 font-medium"
              >
                Edit
              </Button>
            )}
          </>
        )}

        {/* Tombol Aksi untuk Location Manager */}
        {isLocationManager && isPendingApproval && (
          <>
            {!isIntipDone ? (
              <Button
                onClick={onOpenIntipForm}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
              >
                Input Data Intip
              </Button>
            ) : (
              <ApprovalStatusbutton
                currentStatus={currentStatus}
                show={true}
                fileUploaded={true}
                onApprove={onApprove}
                loading={isApproving}
                disabled={isApproving}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
