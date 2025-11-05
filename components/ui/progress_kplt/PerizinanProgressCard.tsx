// components/ui/progress_kplt/PerizinanProgressCard.tsx
"use client";

import React, { useState } from "react";
import { usePerizinanProgress } from "@/hooks/progress_kplt/usePerizinanProgreess";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PerizinanEditableSchema } from "@/lib/validations/perizinan";
import { useAlert } from "@/components/shared/alertcontext";
import { ProgressStatusCard } from "./ProgressStatusCard";

// Komponen DetailCard (Helper)
const DetailCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] ${className}`}
  >
    <div className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// Komponen FileLink (Helper)
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

// Input File Helper untuk Form
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

// Form Komponen
interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onCancelEdit?: () => void;
  filesMap: Map<string, ApiFile>;
}

const PerizinanForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
  filesMap,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();
  // State untuk 5 file
  const [fileSph, setFileSph] = useState<File | null>(null);
  const [fileSt, setFileSt] = useState<File | null>(null);
  const [fileDenah, setFileDenah] = useState<File | null>(null);
  const [fileSpk, setFileSpk] = useState<File | null>(null);
  const [fileNotaris, setFileNotaris] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    // Tambahkan file ke FormData jika ada
    if (fileSph) formData.append("file_sph", fileSph);
    if (fileSt) formData.append("file_bukti_st", fileSt);
    if (fileDenah) formData.append("file_denah", fileDenah);
    if (fileSpk) formData.append("file_spk", fileSpk);
    if (fileNotaris) formData.append("file_rekom_notaris", fileNotaris);

    // Ambil data non-file untuk validasi
    const payload = {
      tgl_sph: formData.get("tgl_sph") || undefined,
      tgl_st: formData.get("tgl_st") || undefined,
      tgl_denah: formData.get("tgl_denah") || undefined,
      tgl_spk: formData.get("tgl_spk") || undefined,
      tgl_rekom_notaris: formData.get("tgl_rekom_notaris") || undefined,
      biaya_perizinan: Number(formData.get("biaya_perizinan")) || undefined,
    };
    const parsed = PerizinanEditableSchema.partial().safeParse(payload);

    if (!parsed.success) {
      console.error(parsed.error.format());
      showToast({
        type: "error",
        message: "Data tidak valid. Periksa kembali input Anda.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(`/api/progress/${progressId}/perizinan`, {
        method,
        body: formData, // Kirim sebagai FormData
      });

      const json = await res.json();
      if (!res.ok) {
        const errMsg =
          json.detail?.[0]?.message || json.error || "Gagal menyimpan data";
        throw new Error(errMsg);
      }
      showToast({
        type: "success",
        message: `Data Perizinan berhasil di${
          initialData ? "update" : "simpan"
        }.`,
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showToast({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DetailCard
      title="Perizinan"
      icon={<FileText className="text-blue-500 mr-3" size={20} />}
      className="mt-10"
    >
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Tanggal Fields */}
        <div>
          <label htmlFor="tgl_sph" className="block font-semibold mb-2">
            Tanggal SPH
          </label>
          <Input
            id="tgl_sph"
            name="tgl_sph"
            type="date"
            defaultValue={initialData?.tgl_sph || ""}
          />
        </div>
        <div>
          <label htmlFor="tgl_st" className="block font-semibold mb-2">
            Tanggal ST
          </label>
          <Input
            id="tgl_st"
            name="tgl_st"
            type="date"
            defaultValue={initialData?.tgl_st || ""}
          />
        </div>
        <div>
          <label htmlFor="tgl_denah" className="block font-semibold mb-2">
            Tanggal Denah
          </label>
          <Input
            id="tgl_denah"
            name="tgl_denah"
            type="date"
            defaultValue={initialData?.tgl_denah || ""}
          />
        </div>
        <div>
          <label htmlFor="tgl_spk" className="block font-semibold mb-2">
            Tanggal SPK
          </label>
          <Input
            id="tgl_spk"
            name="tgl_spk"
            type="date"
            defaultValue={initialData?.tgl_spk || ""}
          />
        </div>
        <div>
          <label
            htmlFor="tgl_rekom_notaris"
            className="block font-semibold mb-2"
          >
            Tanggal Rekom Notaris
          </label>
          <Input
            id="tgl_rekom_notaris"
            name="tgl_rekom_notaris"
            type="date"
            defaultValue={initialData?.tgl_rekom_notaris || ""}
          />
        </div>
        <div>
          <label htmlFor="biaya_perizinan" className="block font-semibold mb-2">
            Biaya Perizinan (Rp)
          </label>
          <Input
            id="biaya_perizinan"
            name="biaya_perizinan"
            type="number"
            defaultValue={initialData?.biaya_perizinan || ""}
          />
        </div>

        {/* File Fields */}
        <FormFileInput
          label="File SPH"
          name="file_sph"
          currentFile={filesMap.get("file_sph")}
          isFileSelected={!!fileSph}
          onChange={(e) => setFileSph(e.target.files?.[0] || null)}
        />
        <FormFileInput
          label="File Bukti ST"
          name="file_bukti_st"
          currentFile={filesMap.get("file_bukti_st")}
          isFileSelected={!!fileSt}
          onChange={(e) => setFileSt(e.target.files?.[0] || null)}
        />
        <FormFileInput
          label="File Denah"
          name="file_denah"
          currentFile={filesMap.get("file_denah")}
          isFileSelected={!!fileDenah}
          onChange={(e) => setFileDenah(e.target.files?.[0] || null)}
        />
        <FormFileInput
          label="File SPK"
          name="file_spk"
          currentFile={filesMap.get("file_spk")}
          isFileSelected={!!fileSpk}
          onChange={(e) => setFileSpk(e.target.files?.[0] || null)}
        />
        <FormFileInput
          label="File Rekom Notaris"
          name="file_rekom_notaris"
          currentFile={filesMap.get("file_rekom_notaris")}
          isFileSelected={!!fileNotaris}
          onChange={(e) => setFileNotaris(e.target.files?.[0] || null)}
        />

        <div className="md:col-span-2 flex justify-end gap-3 mt-6">
          {onCancelEdit && (
            <Button variant="default" onClick={onCancelEdit} type="button">
              <XCircle className="mr-2" size={16} />
              Batal
            </Button>
          )}
          <Button type="submit" variant="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
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

// Komponen Utama
const PerizinanProgressCard: React.FC<{ progressId: string }> = ({
  progressId,
}) => {
  const {
    data,
    loading: loadingData,
    error: errorData,
    refetch,
  } = usePerizinanProgress(progressId);
  const {
    filesMap,
    loading: loadingFiles,
    error: errorFiles,
    refresh: refreshFiles,
  } = useFile("perizinan", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return "-";
    }
  };

  const handleSubmitApproval = async () => {
    const isConfirmed = await showConfirmation({
      title: "Konfirmasi Approval Perizinan",
      message:
        "Apakah Anda yakin ingin submit data ini? Data yang sudah di-submit tidak dapat diubah kembali.",
      confirmText: "Ya, Submit",
      type: "warning",
    });

    if (!isConfirmed) return;
    setIsSubmittingApproval(true);

    try {
      const payload = { final_status_perizinan: "selesai" };
      const res = await fetch(
        `/api/progress/${progressId}/perizinan/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        let errorTitle = "Submit Gagal";
        let errorMessage = json.error || "Gagal melakukan submit.";
        if (json.missing_fields) {
          errorTitle = "Data Belum Lengkap";
          errorMessage = `Mohon isi field berikut: ${json.missing_fields.join(
            ", "
          )}`;
        }
        showToast({
          type: "error",
          title: errorTitle,
          message: errorMessage,
        });
        setIsSubmittingApproval(false);
        return;
      }
      showToast({
        type: "success",
        message: "Perizinan berhasil diajukan untuk approval.",
      });
      await refetch();
      await refreshFiles();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const isLoading = loadingData || loadingFiles;
  const error = errorData || errorFiles;

  if (isLoading)
    return (
      <div className="flex justify-center py-10 mt-8 w-full max-w-5xl mx-auto">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center py-5 mt-8 w-full max-w-5xl mx-auto">
        Terjadi kesalahan: {error}
      </div>
    );

  if (!data || isEditing) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <ProgressStatusCard
          title="Perizinan"
          status={data?.final_status_perizinan}
          startDate={data?.created_at}
          endDate={data?.tgl_selesai_perizinan}
        />
        <PerizinanForm
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
  }

  // Mode Read
  return (
    <div className="w-full max-w-5xl mx-auto">
      <ProgressStatusCard
        title="Perizinan"
        status={data.final_status_perizinan}
        startDate={data.created_at}
        endDate={data.tgl_selesai_perizinan}
      />
      <DetailCard
        title="Perizinan"
        icon={<FileText className="text-blue-500 mr-3" size={20} />}
        className="mt-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Fields */}
          <div>
            <h3 className="font-semibold mb-2">Tanggal SPH</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              {formatDate(data.tgl_sph) || "-"}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tanggal ST</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              {formatDate(data.tgl_st) || "-"}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tanggal Denah</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              {formatDate(data.tgl_denah) || "-"}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tanggal SPK</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              {formatDate(data.tgl_spk) || "-"}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tanggal Rekom Notaris</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              {formatDate(data.tgl_rekom_notaris) || "-"}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Biaya Perizinan (Rp)</h3>
            <div className="bg-gray-100 rounded-md px-4 py-2">
              Rp {data.biaya_perizinan?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          {/* File Fields */}
          <div className="md:col-span-2">
            <h3 className="font-semibold mb-2">Dokumen</h3>
            <div className="space-y-3">
              <FileLink label="File SPH" file={filesMap.get("file_sph")} />
              <FileLink
                label="File Bukti ST"
                file={filesMap.get("file_bukti_st")}
              />
              <FileLink label="File Denah" file={filesMap.get("file_denah")} />
              <FileLink label="File SPK" file={filesMap.get("file_spk")} />
              <FileLink
                label="File Rekom Notaris"
                file={filesMap.get("file_rekom_notaris")}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="default" onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2" size={16} />
            Edit
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSubmitApproval}
            disabled={isSubmittingApproval}
          >
            {isSubmittingApproval ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <CheckCircle className="mr-2" size={16} />
            )}
            Submit
          </Button>
        </div>
      </DetailCard>
    </div>
  );
};

export default PerizinanProgressCard;
