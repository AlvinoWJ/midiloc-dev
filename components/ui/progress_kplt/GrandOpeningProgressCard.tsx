// components/ui/progress_kplt/GrandOpeningProgressCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useGrandOpeningProgress } from "@/hooks/progress_kplt/useGrandOpeningProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  PartyPopper, // Icon untuk Grand Opening
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/customselect";
import { GOEditableSchema } from "@/lib/validations/grand_opening";
import { useAlert } from "@/components/shared/alertcontext";
import { useUser } from "@/hooks/useUser";

// DetailCard (Helper)
const DetailCard = ({
  title,
  icon,
  children,
  className = "",
  actions,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) => (
  <div
    className={`bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ${className}`}
  >
    <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900 ml-2">{title}</h2>
      </div>
      <div>{actions}</div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// Form Component
interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onDataUpdate: () => void;
  onCancelEdit?: () => void;
}

const GrandOpeningForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onDataUpdate,
  onCancelEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();

  const statusOptions = ["Belum", "Selesai", "Batal"];

  const [rekomGoVendor, setRekomGoVendor] = useState<string>(
    initialData?.rekom_go_vendor || ""
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Ambil semua field dari form
    const payload = {
      rekom_go_vendor: rekomGoVendor || undefined,
      tgl_rekom_go_vendor: formData.get("tgl_rekom_go_vendor") || undefined,
      tgl_go: formData.get("tgl_go") || undefined,
    };
    const parsed = GOEditableSchema.partial().safeParse(payload);

    if (!parsed.success) {
      showToast({
        type: "error",
        message: "Data tidak valid. Periksa kembali input Anda.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(`/api/progress/${progressId}/grand_opening`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || json.detail || json.error || "Gagal menyimpan data"
        );
      }

      onDataUpdate();
      showToast({
        type: "success",
        message: `Data Grand Opening berhasil di${
          initialData ? "update" : "simpan"
        }.`,
      });
      onSuccess();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Gagal",
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailCard
      title="Grand Opening"
      icon={<PartyPopper className="text-green-500 mr-3" size={20} />}
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label
            htmlFor="tgl_go"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Grand Opening
          </label>
          <Input
            id="tgl_go"
            name="tgl_go"
            type="date"
            defaultValue={initialData?.tgl_go || ""}
          />
        </div>
        <div>
          <label
            htmlFor="tgl_rekom_go_vendor"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Rekom GO Vendor
          </label>
          <Input
            id="tgl_rekom_go_vendor"
            name="tgl_rekom_go_vendor"
            type="date"
            defaultValue={initialData?.tgl_rekom_go_vendor || ""}
          />
        </div>
        <div className="md:col-span-2">
          <CustomSelect
            id="rekom_go_vendor"
            name="rekom_go_vendor"
            label="Rekomendasi GO Vendor"
            placeholder="Pilih Status"
            value={rekomGoVendor}
            options={statusOptions}
            onChange={(e) => setRekomGoVendor(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-3 mt-6">
          {onCancelEdit && (
            <Button
              variant="default"
              onClick={onCancelEdit}
              type="button"
              className="min-w-30"
            >
              <XCircle className="mr-2" size={16} />
              Batal
            </Button>
          )}
          <Button
            type="submit"
            variant="submit"
            disabled={isSubmitting}
            className="min-w-30"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <CheckCircle className="mr-2" size={16} />
            )}
            Simpan
          </Button>
        </div>
      </form>
    </DetailCard>
  );
};

const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <h3 className="block font-semibold text-base lg:text-lg mb-2">{label}</h3>
    <div className="bg-gray-100 px-4 py-2 rounded-md min-h-[40px]">
      {value || "-"}
    </div>
  </div>
);

interface GrandOpeningProgressCardProps {
  progressId: string;
  onDataUpdate: () => void;
}

const GrandOpeningProgressCard: React.FC<GrandOpeningProgressCardProps> = ({
  progressId,
  onDataUpdate,
}) => {
  const { data, loading, error, refetch } = useGrandOpeningProgress(progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  const { user } = useUser();
  const isBranchAdmin = user?.position_nama === "admin branch";

  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  useEffect(() => {
    refetch();
  }, [progressId]);

  const handleFinalizeGO = async () => {
    const confirmed = await showConfirmation({
      title: "Konfirmasi submit Grand Opening",
      message: "Apakah Anda yakin ingin submit data ini?",
      confirmText: "Ya, Submit",
      type: "warning",
    });
    if (!confirmed) return;
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(
        `/api/progress/${progressId}/grand_opening/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ final_status_go: "selesai" }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit");
      onDataUpdate();
      showToast({
        type: "success",
        title: "Berhasil melakukan Submit",
        message: "Grand Opening berhasil disubmit.",
      });
      await refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Gagal melakukan Submit",
        message: "Terdapat kolom yang kosong atau belum selesai",
      });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10 mt-8 w-full w-full">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center py-5 mt-8 w-full w-full">
        Terjadi kesalahan: {error}
      </div>
    );

  if (!data || isEditing)
    return (
      <div className="w-full w-full">
        <GrandOpeningForm
          progressId={progressId}
          onSuccess={async () => {
            await refetch();
            setIsEditing(false);
          }}
          initialData={data}
          onDataUpdate={onDataUpdate}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
        />
      </div>
    );

  const isFinalized =
    data.final_status_go === "Selesai" || data.final_status_go === "Batal";

  return (
    <div className="w-full w-full">
      <DetailCard
        title="Grand Opening"
        icon={<PartyPopper className="text-green-500" size={20} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailField
            label="Tanggal Grand Opening"
            value={formatDate(data.tgl_go)}
          />

          <DetailField
            label="Tanggal Rekom GO Vendor"
            value={formatDate(data.tgl_rekom_go_vendor)}
          />
          <div className="md:col-span-2">
            <DetailField
              label="Rekomendasi GO Vendor"
              value={data.rekom_go_vendor}
            />
          </div>
        </div>
        {!isFinalized && isBranchAdmin && (
          <div className="flex justify-between items-center mt-8">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2" size={16} /> Edit
            </Button>
            <Button
              type="submit"
              variant="submit"
              onClick={handleFinalizeGO}
              disabled={isSubmittingApproval}
            >
              {isSubmittingApproval ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle className="mr-2" size={16} />
              )}{" "}
              Submit
            </Button>
          </div>
        )}
      </DetailCard>
    </div>
  );
};

export default GrandOpeningProgressCard;
