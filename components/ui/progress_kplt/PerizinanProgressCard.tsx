// components/ui/progress_kplt/PerizinanProgressCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { usePerizinanProgress } from "@/hooks/progress_kplt/usePerizinanProgreess";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  FileText,
  Link as LinkIcon,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomSelect from "@/components/ui/customselect";
import { Input } from "@/components/ui/input";
import { PerizinanEditableSchema } from "@/lib/validations/perizinan";
import { useAlert } from "@/components/shared/alertcontext";
import { PerizinanHistoryModal } from "./PerizinanHistoryModal";
import { useUser } from "@/hooks/useUser";

const formatnumeric = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  const numberValue =
    typeof value === "string"
      ? Number(value.replace(/\./g, ""))
      : Number(value);
  if (isNaN(numberValue)) return "";
  return new Intl.NumberFormat("id-ID").format(numberValue);
};

const unformatnumeric = (value: string | undefined | null) => {
  if (!value) return undefined;
  const unformatted = value.replace(/\./g, "");
  const numberValue = Number(unformatted);
  return isNaN(numberValue) ? undefined : numberValue;
};

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

const FileLink = ({
  label,
  file,
}: {
  label: string;
  file: ApiFile | undefined;
}) => {
  if (!file) {
    return (
      <div className="flex items-center border justify-between bg-white px-3 py-2 rounded text-sm mb-2">
        <span className="text-gray-400 italic">{label} (Kosong)</span>
      </div>
    );
  }
  return (
    <div className="flex items-center border justify-between bg-white px-3 py-1 rounded text-sm gap-2 mb-2">
      <span className="text-gray-900 truncate flex-1 min-w-0" title={file.name}>
        {file.name}
      </span>
      <a
        href={file.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded flex-shrink-0 whitespace-nowrap"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

const FormFileInput: React.FC<{
  label: string;
  name: string;
  currentFile: ApiFile | undefined;
  isFileSelected: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, currentFile, isFileSelected, onChange }) => (
  <div className="mb-4">
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

interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onDataUpdate: () => void;
  onCancelEdit?: () => void;
  filesMap: Map<string, ApiFile>;
}

const PerizinanForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onDataUpdate,
  onCancelEdit,
  filesMap,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();

  const [fileSph, setFileSph] = useState<File | null>(null);
  const [fileSt, setFileSt] = useState<File | null>(null);
  const [fileDenah, setFileDenah] = useState<File | null>(null);
  const [fileSpk, setFileSpk] = useState<File | null>(null);
  const [fileNotaris, setFileNotaris] = useState<File | null>(null);

  const [displayNominalSph, setDisplayNominalSph] = useState<string>("");

  const [oss, setoss] = useState<string>(initialData?.oss || "");
  const [statusBerkas, setStatusBerkas] = useState<string>(
    initialData?.status_berkas || ""
  );
  const [statusGambarDenah, setStatusGambarDenah] = useState<string>(
    initialData?.status_gambar_denah || ""
  );
  const [statusSpk, setStatusSpk] = useState<string>(
    initialData?.status_spk || ""
  );
  const [rekomNotarisVendor, setRekomNotarisVendor] = useState<string>(
    initialData?.rekom_notaris_vendor || ""
  );

  const StatusOptions = ["Belum", "Selesai", "Batal"];

  useEffect(() => {
    if (initialData) {
      setDisplayNominalSph(formatnumeric(initialData.nominal_sph));
      setoss(initialData?.oss || "");
      setStatusBerkas(initialData?.status_berkas || "");
      setStatusGambarDenah(initialData?.status_gambar_denah || "");
      setStatusSpk(initialData?.status_spk || "");
      setRekomNotarisVendor(initialData?.rekom_notaris_vendor || "");
    }
  }, [initialData]);

  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const { value } = e.target;
    const rawValue = value.replace(/\./g, "");
    if (!/^\d*$/.test(rawValue)) return;

    setter(formatnumeric(rawValue));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    if (fileSph) formData.append("file_sph", fileSph);
    if (fileSt) formData.append("file_bukti_st", fileSt);
    if (fileDenah) formData.append("file_denah", fileDenah);
    if (fileSpk) formData.append("file_spk", fileSpk);
    if (fileNotaris) formData.append("file_rekom_notaris", fileNotaris);

    formData.append("oss", oss);
    formData.append("status_berkas", statusBerkas);
    formData.append("status_gambar_denah", statusGambarDenah);
    formData.append("status_spk", statusSpk);
    formData.append("rekom_notaris_vendor", rekomNotarisVendor);

    const nominalSphUnformatted = unformatnumeric(displayNominalSph);
    formData.set(
      "nominal_sph",
      nominalSphUnformatted !== undefined ? String(nominalSphUnformatted) : ""
    );

    const payload = {
      oss: oss || undefined,
      tgl_oss: formData.get("tgl_oss"),
      tgl_sph: formData.get("tgl_sph") || undefined,
      nominal_sph: nominalSphUnformatted,
      status_berkas: statusBerkas || undefined,
      tgl_st_berkas: formData.get("tgl_st_berkas") || undefined,
      status_gambar_denah: statusGambarDenah || undefined,
      tgl_gambar_denah: formData.get("tgl_gambar_denah") || undefined,
      status_spk: statusSpk || undefined,
      tgl_spk: formData.get("tgl_spk") || undefined,
      rekom_notaris_vendor: rekomNotarisVendor || undefined,
      tgl_rekom_notaris: formData.get("tgl_rekom_notaris") || undefined,
    };
    const parsed = PerizinanEditableSchema.partial().safeParse(payload);

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
      const res = await fetch(`/api/progress/${progressId}/perizinan`, {
        method,
        body: formData,
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
        message: `Data Perizinan berhasil di${
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
      title="Perizinan"
      icon={<FileText className="text-blue-500 mr-3" size={20} />}
    >
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OSS */}
          <div>
            <label
              htmlFor="tgl_oss"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
              Tanggal OSS
            </label>
            <Input
              id="tgl_oss"
              name="tgl_oss"
              type="date"
              defaultValue={initialData?.tgl_oss || ""}
              className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer pr-10"
            />
          </div>
          <CustomSelect
            id="oss"
            name="oss"
            label="OSS"
            placeholder="Pilih Status"
            value={oss}
            options={StatusOptions}
            onChange={(e) => setoss(e.target.value)}
          />

          {/* 1. Tanggal SPH - Nominal SPH */}
          <div>
            <label
              htmlFor="tgl_sph"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
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
            <label
              htmlFor="nominal_sph"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
              Nominal SPH (Rp)
            </label>
            <Input
              id="nominal_sph"
              name="nominal_sph"
              inputMode="numeric"
              value={displayNominalSph}
              onChange={(e) =>
                handleNumericInputChange(e, setDisplayNominalSph)
              }
              placeholder="Masukkan nominal sph"
            />
          </div>

          {/* 2. Tanggal ST - Status Berkas */}
          <div>
            <label
              htmlFor="tgl_st_berkas"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
              Tanggal ST
            </label>
            <Input
              id="tgl_st_berkas"
              name="tgl_st_berkas"
              type="date"
              defaultValue={initialData?.tgl_st_berkas || ""}
            />
          </div>
          <CustomSelect
            id="status_berkas"
            name="status_berkas"
            label="Status Berkas"
            placeholder="Pilih Status"
            value={statusBerkas}
            options={StatusOptions}
            onChange={(e) => setStatusBerkas(e.target.value)}
          />

          {/* 3. Tanggal Denah - Status Gambar Denah */}
          <div>
            <label
              htmlFor="tgl_gambar_denah"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
              Tanggal Denah
            </label>
            <Input
              id="tgl_gambar_denah"
              name="tgl_gambar_denah"
              type="date"
              defaultValue={initialData?.tgl_gambar_denah || ""}
            />
          </div>
          <CustomSelect
            id="status_gambar_denah"
            name="status_gambar_denah"
            label="Status Gambar Denah"
            placeholder="Pilih Status"
            value={statusGambarDenah}
            options={StatusOptions}
            onChange={(e) => setStatusGambarDenah(e.target.value)}
          />

          {/* 4. Tanggal SPK - Status SPK */}
          <div>
            <label
              htmlFor="tgl_spk"
              className="block font-semibold text-base lg:text-lg mb-2"
            >
              Tanggal SPK
            </label>
            <Input
              id="tgl_spk"
              name="tgl_spk"
              type="date"
              defaultValue={initialData?.tgl_spk || ""}
            />
          </div>
          <CustomSelect
            id="status_spk"
            name="status_spk"
            label="Status SPK"
            placeholder="Pilih Status"
            value={statusSpk}
            options={StatusOptions}
            onChange={(e) => setStatusSpk(e.target.value)}
          />

          {/* 5. Tanggal Rekom Notaris - Rekom Notaris Vendor */}
          <div>
            <label
              htmlFor="tgl_rekom_notaris"
              className="block font-semibold text-base lg:text-lg mb-2"
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
          <CustomSelect
            id="rekom_notaris_vendor"
            name="rekom_notaris_vendor"
            label="Rekom Notaris Vendor"
            placeholder="Pilih Status"
            value={rekomNotarisVendor}
            options={StatusOptions}
            onChange={(e) => setRekomNotarisVendor(e.target.value)}
          />
        </div>

        {/* File Inputs Moved to Bottom */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="space-y-4">
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
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
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

interface PerizinanProgressCardProps {
  progressId: string;
  onDataUpdate: () => void;
}

const PerizinanProgressCard: React.FC<PerizinanProgressCardProps> = ({
  progressId,
  onDataUpdate,
}) => {
  const { data, loading, error, refetch } = usePerizinanProgress(progressId);
  const {
    filesMap,
    loading: loadingFiles,
    error: errorFiles,
    refresh: refreshFiles,
  } = useFile("perizinan", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
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

  const handleFinalizeIT = async (status: "Selesai" | "Batal") => {
    const actionText = status === "Selesai" ? "submit" : "batalkan";
    const actionTitle = status === "Selesai" ? "Submit" : "Pembatalan";
    const confirmText = status === "Selesai" ? "Ya, Submit" : "Ya, Batalkan";

    const isConfirmed = await showConfirmation({
      title: `Konfirmasi ${actionTitle} Perizinan`,
      message: `Apakah Anda yakin ingin ${actionText} Perizinan ini? Data yang sudah di-${actionText} tidak dapat diubah kembali.`,
      confirmText: confirmText,
      type: "warning",
    });

    if (!isConfirmed) return;

    if (status === "Selesai") {
      setIsSubmittingApprove(true);
    } else {
      setIsSubmittingReject(true);
    }

    try {
      const apiStatus = status.toLowerCase() as "selesai" | "batal";
      const res = await fetch(
        `/api/progress/${progressId}/perizinan/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ final_status_perizinan: apiStatus }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        const errorMsg =
          json.detail || json.error || "Gagal melakukan " + actionText;
        let errorTitle = "Gagal";

        if (errorMsg.includes("Required fields missing")) {
          errorTitle = "Data Belum Lengkap";
        } else if (errorMsg.includes("already finalized")) {
          errorTitle = "Sudah Final";
        }

        showToast({
          type: "error",
          title: errorTitle,
          message: "Terdapat kolom yang kosong atau belum selesai",
        });
        return;
      }
      onDataUpdate();
      showToast({
        type: "success",
        message: `Perizinan berhasil di-${actionText}.`,
      });
      await refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: err.message || `Gagal melakukan ${actionText}.`,
      });
    } finally {
      setIsSubmittingApprove(false);
      setIsSubmittingReject(false);
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
        <PerizinanForm
          progressId={progressId}
          onSuccess={async () => {
            await refetch();
            await refreshFiles();
            setIsEditing(false);
          }}
          initialData={data}
          onDataUpdate={onDataUpdate}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
          filesMap={filesMap}
        />
      </div>
    );

  const isFinalized =
    data.final_status_perizinan === "Selesai" ||
    data.final_status_perizinan === "Batal";

  return (
    <div className="w-full ">
      <DetailCard
        title="Perizinan"
        icon={<FileText className="text-blue-500 mr-3" size={20} />}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OSS */}
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Tanggal OSS
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_oss)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                OSS
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {data.oss || "-"}
              </div>
            </div>

            {/* SPH - Nominal */}
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Tanggal SPH
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_sph)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Nominal SPH
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                Rp {data.nominal_sph?.toLocaleString("id-ID") || "-"}
              </div>
            </div>

            {/* ST - Status Berkas */}
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Tanggal ST
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_st_berkas)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Status Berkas
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {data.status_berkas || "-"}
              </div>
            </div>

            {/* Denah - Status Denah */}
            <div>
              <h3 className="font-semibold  mb-2">Tanggal Denah</h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_gambar_denah)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Status Gambar Denah
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {data.status_gambar_denah || "-"}
              </div>
            </div>

            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Tanggal SPK
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_spk)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Status SPK
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {data.status_spk || "-"}
              </div>
            </div>

            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Tanggal Rekom Notaris
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {formatDate(data.tgl_rekom_notaris)}
              </div>
            </div>
            <div>
              <h3 className="block font-semibold text-base lg:text-lg mb-2">
                Rekom Notaris Vendor
              </h3>
              <div className="bg-gray-100 px-4 py-2 rounded-md">
                {data.rekom_notaris_vendor || "-"}
              </div>
            </div>
          </div>

          {/* Files List Moved to Bottom */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dokumen Pendukung
            </h3>
            <div className="space-y-4">
              <div>
                <h3 className="block font-semibold text-base lg:text-lg mb-2">
                  File SPH
                </h3>
                <FileLink label="File SPH" file={filesMap.get("file_sph")} />
              </div>
              <div>
                <h3 className="block font-semibold text-base lg:text-lg mb-2">
                  File Bukti ST
                </h3>
                <FileLink
                  label="File Bukti ST"
                  file={filesMap.get("file_bukti_st")}
                />
              </div>
              <div>
                <h3 className="block font-semibold text-base lg:text-lg mb-2">
                  File Denah
                </h3>
                <FileLink
                  label="File Denah"
                  file={filesMap.get("file_denah")}
                />
              </div>
              <div>
                <h3 className="block font-semibold text-base lg:text-lg mb-2">
                  File SPK
                </h3>
                <FileLink label="File SPK" file={filesMap.get("file_spk")} />
              </div>
              <div>
                <h3 className="block font-semibold text-base lg:text-lg mb-2">
                  File Rekom Notaris
                </h3>
                <FileLink
                  label="File Rekom Notaris"
                  file={filesMap.get("file_rekom_notaris")}
                />
              </div>
            </div>
          </div>
        </div>

        {!isFinalized && isBranchAdmin && (
          <div className="flex gap-3 mt-6">
            {/* Tombol Edit */}
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              disabled={isSubmittingApprove || isSubmittingReject}
              className="mr-auto"
            >
              <Pencil className="mr-2" size={16} /> Edit
            </Button>

            {/* Tombol Batal */}
            <Button
              variant="default"
              onClick={() => handleFinalizeIT("Batal")}
              disabled={isSubmittingApprove || isSubmittingReject}
            >
              {isSubmittingReject ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <XCircle className="mr-2" size={16} />
              )}
              Batal
            </Button>

            {/* Tombol Submit */}
            <Button
              type="submit"
              variant="submit"
              onClick={() => handleFinalizeIT("Selesai")}
              disabled={isSubmittingApprove || isSubmittingReject}
            >
              {isSubmittingApprove ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle className="mr-2" size={16} />
              )}
              Submit
            </Button>
          </div>
        )}
      </DetailCard>
      {showHistoryModal && (
        <PerizinanHistoryModal
          progressId={progressId}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default PerizinanProgressCard;
