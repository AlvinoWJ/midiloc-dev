// components/ui/progress_kplt/NotarisProgressCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useNotarisProgress } from "@/hooks/progress_kplt/useNotarisProgress";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
  History,
  Briefcase, // Icon baru untuk Notaris
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/customselect";
import { NotarisEditableSchema } from "@/lib/validations/notaris";
import { useAlert } from "@/components/shared/alertcontext";
import { ProgressStatusCard } from "./ProgressStatusCard";
import { NotarisHistoryModal } from "./NotarisHistoryModal";

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

// FileLink (Helper)
const FileLink = ({
  label,
  file,
}: {
  label: string;
  file: ApiFile | undefined;
}) => {
  if (!file) {
    return (
      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
        <span className="text-sm text-gray-400 italic">{label} (Kosong)</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span
        className="text-sm text-gray-700 font-medium truncate pr-4"
        title={file.name}
      >
        {label}
      </span>
      <a
        href={file.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex-shrink-0"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

// FormFileInput (Helper)
const FormFileInput: React.FC<{
  label: string;
  name: string;
  currentFile: ApiFile | undefined;
  isFileSelected: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, currentFile, isFileSelected, onChange }) => (
  <div className="md:col-span-2">
    <label
      htmlFor={name}
      className="block font-semibold text-base lg:text-lg mb-2"
    >
      {label}
    </label>
    {currentFile && !isFileSelected && (
      <FileLink label={currentFile.name} file={currentFile} />
    )}
    <Input
      id={name}
      name={name}
      type="file"
      onChange={onChange}
      className="mt-2"
    />
  </div>
);

// Form Component
interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onCancelEdit?: () => void;
  filesMap: Map<string, ApiFile>;
}

const NotarisForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
  filesMap,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();
  const [fileParOnline, setFileParOnline] = useState<File | null>(null);

  // Opsi untuk dropdown
  const statusOptions = ["Belum", "Selesai", "Batal"];

  const [validasiLegal, setValidasiLegal] = useState<string>(
    initialData?.validasi_legal || ""
  );
  const [statusNotaris, setStatusNotaris] = useState<string>(
    initialData?.status_notaris || ""
  );
  const [statusPembayaran, setStatusPembayaran] = useState<string>(
    initialData?.status_pembayaran || ""
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    if (fileParOnline) formData.append("par_online", fileParOnline);

    // Tambahkan nilai dari state select
    formData.append("validasi_legal", validasiLegal);
    formData.append("status_notaris", statusNotaris);
    formData.append("status_pembayaran", statusPembayaran);

    const payload = {
      tanggal_par: formData.get("tanggal_par") || undefined,
      validasi_legal: validasiLegal || undefined,
      tanggal_validasi_legal:
        formData.get("tanggal_validasi_legal") || undefined,
      tanggal_plan_notaris: formData.get("tanggal_plan_notaris") || undefined,
      tanggal_notaris: formData.get("tanggal_notaris") || undefined,
      status_notaris: statusNotaris || undefined,
      status_pembayaran: statusPembayaran || undefined,
      tanggal_pembayaran: formData.get("tanggal_pembayaran") || undefined,
    };
    const parsed = NotarisEditableSchema.partial().safeParse(payload);

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
      const res = await fetch(`/api/progress/${progressId}/notaris`, {
        method,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data");
      showToast({
        type: "success",
        message: `Data Notaris berhasil di${
          initialData ? "update" : "simpan"
        }.`,
      });
      onSuccess();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailCard
      title="Notaris"
      icon={<Briefcase className="text-purple-500 mr-3" size={20} />}
      className="mt-10"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <FormFileInput
          label="PAR Online"
          name="par_online"
          currentFile={filesMap.get("par_online")}
          isFileSelected={!!fileParOnline}
          onChange={(e) => setFileParOnline(e.target.files?.[0] || null)}
        />

        <div>
          <label
            htmlFor="tanggal_par"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal PAR
          </label>
          <Input
            id="tanggal_par"
            name="tanggal_par"
            type="date"
            defaultValue={initialData?.tanggal_par || ""}
          />
        </div>

        <CustomSelect
          id="validasi_legal"
          name="validasi_legal"
          label="Validasi Legal"
          placeholder="Pilih Status"
          value={validasiLegal}
          options={statusOptions}
          onChange={(e) => setValidasiLegal(e.target.value)}
        />

        <div>
          <label
            htmlFor="tanggal_validasi_legal"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Validasi Legal
          </label>
          <Input
            id="tanggal_validasi_legal"
            name="tanggal_validasi_legal"
            type="date"
            defaultValue={initialData?.tanggal_validasi_legal || ""}
          />
        </div>

        <div>
          <label
            htmlFor="tanggal_plan_notaris"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Plan Notaris
          </label>
          <Input
            id="tanggal_plan_notaris"
            name="tanggal_plan_notaris"
            type="date"
            defaultValue={initialData?.tanggal_plan_notaris || ""}
          />
        </div>

        <div>
          <label
            htmlFor="tanggal_notaris"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Notaris
          </label>
          <Input
            id="tanggal_notaris"
            name="tanggal_notaris"
            type="date"
            defaultValue={initialData?.tanggal_notaris || ""}
          />
        </div>

        <CustomSelect
          id="status_notaris"
          name="status_notaris"
          label="Status Notaris"
          placeholder="Pilih Status"
          value={statusNotaris}
          options={statusOptions}
          onChange={(e) => setStatusNotaris(e.target.value)}
        />

        <CustomSelect
          id="status_pembayaran"
          name="status_pembayaran"
          label="Status Pembayaran"
          placeholder="Pilih Status"
          value={statusPembayaran}
          options={statusOptions}
          onChange={(e) => setStatusPembayaran(e.target.value)}
        />

        <div>
          <label
            htmlFor="tanggal_pembayaran"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Pembayaran
          </label>
          <Input
            id="tanggal_pembayaran"
            name="tanggal_pembayaran"
            type="date"
            defaultValue={initialData?.tanggal_pembayaran || ""}
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

// Komponen Read-Only
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

// Komponen Utama
const NotarisProgressCard: React.FC<{ progressId: string }> = ({
  progressId,
}) => {
  const { data, loading, error, refetch } = useNotarisProgress(progressId);
  const {
    filesMap,
    loading: loadingFiles,
    error: errorFiles,
    refresh: refreshFiles,
  } = useFile("notaris", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { showToast, showConfirmation } = useAlert();

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
    refreshFiles();
  }, [progressId]);

  const handleSubmitApproval = async () => {
    const confirmed = await showConfirmation({
      title: "Konfirmasi Approval Notaris",
      message: "Apakah Anda yakin ingin submit data ini?",
      confirmText: "Ya, Submit",
      type: "warning",
    });
    if (!confirmed) return;
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/progress/${progressId}/notaris/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_status_notaris: "selesai" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit");
      showToast({
        type: "success",
        message: "Notaris berhasil disubmit.",
      });
      await refetch();
      await refreshFiles();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  if (loading || loadingFiles)
    return (
      <div className="flex justify-center py-10 mt-8 w-full ">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </div>
    );

  if (error || errorFiles)
    return (
      <div className="text-red-500 text-center py-5 mt-8 w-full ">
        Terjadi kesalahan: {error || errorFiles}
      </div>
    );

  if (!data || isEditing)
    return (
      <div className="w-full ">
        <ProgressStatusCard
          title="Notaris"
          status={data?.final_status_notaris}
          startDate={data?.created_at}
          endDate={data?.tgl_selesai_notaris}
        />
        <NotarisForm
          progressId={progressId}
          onSuccess={async () => {
            await refetch();
            await refreshFiles();
            setIsEditing(false);
          }}
          initialData={data}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
          filesMap={filesMap}
        />
      </div>
    );

  const isFinalized =
    data.final_status_notaris === "Selesai" ||
    data.final_status_notaris === "Batal";

  return (
    <div className="w-full ">
      <ProgressStatusCard
        title="Notaris"
        status={data.final_status_notaris}
        startDate={data.created_at}
        endDate={data.tgl_selesai_notaris}
      />
      <DetailCard
        title="Notaris"
        icon={<Briefcase className="text-purple-500" size={20} />}
        className="mt-10"
        actions={
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="rounded"
          >
            <History className="w-4 h-4" />
            Riwayat
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailField
            label="Tanggal PAR"
            value={formatDate(data.tanggal_par)}
          />
          <DetailField label="Validasi Legal" value={data.validasi_legal} />
          <DetailField
            label="Tanggal Validasi Legal"
            value={formatDate(data.tanggal_validasi_legal)}
          />
          <DetailField
            label="Tanggal Plan Notaris"
            value={formatDate(data.tanggal_plan_notaris)}
          />
          <DetailField
            label="Tanggal Notaris"
            value={formatDate(data.tanggal_notaris)}
          />
          <DetailField label="Status Notaris" value={data.status_notaris} />
          <DetailField
            label="Status Pembayaran"
            value={data.status_pembayaran}
          />
          <DetailField
            label="Tanggal Pembayaran"
            value={formatDate(data.tanggal_pembayaran)}
          />
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">Dokumen</h3>
            <div className="space-y-3">
              <FileLink label="PAR Online" file={filesMap.get("par_online")} />
            </div>
          </div>
        </div>
        {!isFinalized && (
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="default" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2" size={16} /> Edit
            </Button>
            <Button
              type="submit"
              variant="submit"
              onClick={handleSubmitApproval}
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
      {showHistoryModal && (
        <NotarisHistoryModal
          progressId={progressId}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default NotarisProgressCard;
