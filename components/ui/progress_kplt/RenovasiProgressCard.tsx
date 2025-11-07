// components/ui/progress_kplt/RenovasiProgressCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRenovasiProgress } from "@/hooks/progress_kplt/useRenovasiProgress";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/customselect";
import { RenovasiEditableSchema } from "@/lib/validations/renovasi";
import { useAlert } from "@/components/shared/alertcontext";
import { ProgressStatusCard } from "./ProgressStatusCard";

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

const RenovasiForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
  filesMap,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();
  const [fileRekomRenovasi, setFileRekomRenovasi] = useState<File | null>(null);

  // Opsi untuk dropdown
  const statusOptions = ["Belum", "Selesai", "Batal"];
  const objekOptions = ["Tanah", "Bangunan"];

  const [rekomRenovasi, setRekomRenovasi] = useState<string>(
    initialData?.rekom_renovasi || ""
  );
  const [BentukObjek, setBentukObjek] = useState<string>(
    initialData?.rekom_renovasi || ""
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    if (fileRekomRenovasi)
      formData.append("file_rekom_renovasi", fileRekomRenovasi);

    // Tambahkan nilai dari state select
    formData.append("rekom_renovasi", rekomRenovasi);

    // Ambil semua field dari form
    const payload = {
      kode_store: formData.get("kode_store") || undefined,
      tipe_toko: formData.get("tipe_toko") || undefined,
      bentuk_objek: formData.get("bentuk_objek") || undefined,
      rekom_renovasi: rekomRenovasi || undefined,
      tgl_rekom_renovasi: formData.get("tgl_rekom_renovasi") || undefined,
      start_spk_renov: formData.get("start_spk_renov") || undefined,
      end_spk_renov: formData.get("end_spk_renov") || undefined,
      plan_renov: Number(formData.get("plan_renov")) || undefined,
      proses_renov: Number(formData.get("proses_renov")) || undefined,
      deviasi: Number(formData.get("deviasi")) || undefined,
      tgl_serah_terima: formData.get("tgl_serah_terima") || undefined,
    };
    const parsed = RenovasiEditableSchema.partial().safeParse(payload);

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
      const res = await fetch(`/api/progress/${progressId}/renovasi`, {
        method,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan data");
      showToast({
        type: "success",
        message: `Data Renovasi berhasil di${
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
      title="Renovasi"
      icon={<Wrench className="text-orange-500 mr-3" size={20} />}
      className="mt-10"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label
            htmlFor="kode_store"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Kode Store
          </label>
          <Input
            id="kode_store"
            name="kode_store"
            type="text"
            defaultValue={initialData?.kode_store || ""}
          />
        </div>

        <div>
          <label
            htmlFor="tipe_toko"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tipe Toko
          </label>
          <Input
            id="tipe_toko"
            name="tipe_toko"
            type="text"
            defaultValue={initialData?.tipe_toko || ""}
          />
        </div>

        <CustomSelect
          id="bentuk_objek"
          name="bentuk_objek"
          label="Bentuk Objek"
          placeholder="Pilih Objek"
          value={BentukObjek}
          options={objekOptions}
          onChange={(e) => setBentukObjek(e.target.value)}
        />

        <CustomSelect
          id="rekom_renovasi"
          name="rekom_renovasi"
          label="Rekomendasi Renovasi"
          placeholder="Pilih Status"
          value={rekomRenovasi}
          options={statusOptions}
          onChange={(e) => setRekomRenovasi(e.target.value)}
        />

        <div>
          <label
            htmlFor="tgl_rekom_renovasi"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Rekomendasi Renovasi
          </label>
          <Input
            id="tgl_rekom_renovasi"
            name="tgl_rekom_renovasi"
            type="date"
            defaultValue={initialData?.tgl_rekom_renovasi || ""}
          />
        </div>

        <div>
          <label
            htmlFor="start_spk_renov"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Start SPK Renovasi
          </label>
          <Input
            id="start_spk_renov"
            name="start_spk_renov"
            type="date"
            defaultValue={initialData?.start_spk_renov || ""}
          />
        </div>

        <div>
          <label
            htmlFor="end_spk_renov"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            End SPK Renovasi
          </label>
          <Input
            id="end_spk_renov"
            name="end_spk_renov"
            type="date"
            defaultValue={initialData?.end_spk_renov || ""}
          />
        </div>

        <div>
          <label
            htmlFor="plan_renov"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Plan Renovasi (hari)
          </label>
          <Input
            id="plan_renov"
            name="plan_renov"
            type="number"
            defaultValue={initialData?.plan_renov || ""}
          />
        </div>

        <div>
          <label
            htmlFor="proses_renov"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Proses Renovasi (%)
          </label>
          <Input
            id="proses_renov"
            name="proses_renov"
            type="number"
            defaultValue={initialData?.proses_renov || ""}
          />
        </div>

        <div>
          <label
            htmlFor="deviasi"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Deviasi (%)
          </label>
          <Input
            id="deviasi"
            name="deviasi"
            type="number"
            defaultValue={initialData?.deviasi || ""}
          />
        </div>

        <div>
          <label
            htmlFor="tgl_serah_terima"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Tanggal Serah Terima
          </label>
          <Input
            id="tgl_serah_terima"
            name="tgl_serah_terima"
            type="date"
            defaultValue={initialData?.tgl_serah_terima || ""}
          />
        </div>

        <FormFileInput
          label="File Rekom Renovasi"
          name="file_rekom_renovasi"
          currentFile={filesMap.get("file_rekom_renovasi")}
          isFileSelected={!!fileRekomRenovasi}
          onChange={(e) => setFileRekomRenovasi(e.target.files?.[0] || null)}
        />

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
const RenovasiProgressCard: React.FC<{ progressId: string }> = ({
  progressId,
}) => {
  const { data, loading, error, refetch } = useRenovasiProgress(progressId);
  const {
    filesMap,
    loading: loadingFiles,
    error: errorFiles,
    refresh: refreshFiles,
  } = useFile("renovasi", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
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
      title: "Konfirmasi Approval Renovasi",
      message: "Apakah Anda yakin ingin submit data ini?",
      confirmText: "Ya, Submit",
      type: "warning",
    });
    if (!confirmed) return;
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/progress/${progressId}/renovasi/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_status_renov: "selesai" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal submit");
      showToast({
        type: "success",
        message: "Renovasi berhasil disubmit.",
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
          title="Renovasi"
          status={data?.final_status_renov}
          startDate={data?.created_at}
          endDate={data?.tgl_selesai_renov}
        />
        <RenovasiForm
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
    data.final_status_renov === "Selesai" ||
    data.final_status_renov === "Batal";

  return (
    <div className="w-full ">
      <ProgressStatusCard
        title="Renovasi"
        status={data.final_status_renov}
        startDate={data.created_at}
        endDate={data.tgl_selesai_renov}
      />
      <DetailCard
        title="Renovasi"
        icon={<Wrench className="text-orange-500" size={20} />}
        className="mt-10"
        // Tidak ada `actions` prop untuk tombol Riwayat
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailField label="Kode Store" value={data.kode_store} />
          <DetailField label="Tipe Toko" value={data.tipe_toko} />
          <DetailField label="Bentuk Objek" value={data.bentuk_objek} />
          <DetailField label="Rekom Renovasi" value={data.rekom_renovasi} />
          <DetailField
            label="Tanggal Rekom Renovasi"
            value={formatDate(data.tgl_rekom_renovasi)}
          />
          <DetailField
            label="Start SPK Renovasi"
            value={formatDate(data.start_spk_renov)}
          />
          <DetailField
            label="End SPK Renovasi"
            value={formatDate(data.end_spk_renov)}
          />
          <DetailField label="Plan Renovasi (%)" value={data.plan_renov} />
          <DetailField label="Proses Renovasi (%)" value={data.proses_renov} />
          <DetailField label="Deviasi (%)" value={data.deviasi} />
          <DetailField
            label="Tanggal Serah Terima"
            value={formatDate(data.tgl_serah_terima)}
          />

          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">Dokumen</h3>
            <div className="space-y-3">
              <FileLink
                label="File Rekom Renovasi"
                file={filesMap.get("file_rekom_renovasi")}
              />
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
      {/* Tidak ada HistoryModal di sini */}
    </div>
  );
};

export default RenovasiProgressCard;
