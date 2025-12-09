"use client";

import React, { useState, useEffect } from "react";
import { useRenovasiProgress } from "@/hooks/progress_kplt/useRenovasiProgress";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import { useUser } from "@/hooks/useUser";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Wrench,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CustomSelect from "@/components/ui/customselect";
import { RenovasiEditableSchema } from "@/lib/validations/renovasi";
import { useAlert } from "@/components/shared/alertcontext";
import { RenovasiHistoryModal } from "./RenovasiHistoryModal";

/**
 * Komponen UI Wrapper untuk Kartu Detail
 */
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

/**
 * Komponen UI untuk Link File Download
 */
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

/**
 * Komponen Input File reusable untuk Form
 */
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

interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onDataUpdate: () => void;
  onCancelEdit?: () => void;
  filesMap: Map<string, ApiFile>;
}

/**
 * Komponen Form: RenovasiForm
 * Menangani input data Renovasi, kalkulasi deviasi, dan file upload.
 */
const RenovasiForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onDataUpdate,
  onCancelEdit,
  filesMap,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();
  const [fileRekomRenovasi, setFileRekomRenovasi] = useState<File | null>(null);

  const statusOptions = ["Belum", "Selesai", "Batal"];
  const objekOptions = ["Tanah", "Bangunan"];
  const tipetokoOptions = [
    "100 REG",
    "200 RAK",
    "60 REG",
    "60N",
    "80 REG",
    "FRESH 10",
    "FRESH 5",
    "SPECIFIC 1",
  ];

  // State lokal untuk Select inputs
  const [rekomRenovasi, setRekomRenovasi] = useState<string>(
    initialData?.rekom_renovasi || ""
  );
  const [bentukObjek, setBentukObjek] = useState<string>(
    initialData?.rekom_renovasi || "" // Note: Mungkin typo di initialData? Cek kembali jika perlu
  );
  const [tipetoko, setTipeToko] = useState<string>(
    initialData?.tipe_toko || ""
  );

  // State untuk kalkulasi Progress & Deviasi
  const [planRenov, setPlanRenov] = useState<string>("");
  const [prosesRenov, setProsesRenov] = useState<string>("");
  const [deviasi, setDeviasi] = useState<string>("");

  /**
   * Helper: Validasi input persentase (0-100, hanya angka).
   */
  const handlePercentageChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const rawValue = value.replace(/[^0-9]/g, ""); // Hanya izinkan angka
    if (rawValue === "") {
      setter("");
      return;
    }

    let numValue = parseInt(rawValue, 10);

    if (numValue > 100) {
      numValue = 100;
    }

    setter(String(numValue));
  };

  // Efek 1: Sinkronisasi data awal saat mode edit aktif
  useEffect(() => {
    if (initialData) {
      setRekomRenovasi(initialData.rekom_renovasi || "");
      setBentukObjek(initialData.bentuk_objek || "");
      setTipeToko(initialData.tipe_toko || "");
      setPlanRenov(initialData.plan_renov?.toString() || "");
      setProsesRenov(initialData.proses_renov?.toString() || "");
      setDeviasi(initialData.deviasi?.toString() || "");
    }
  }, [initialData]);

  // Efek 2: Auto-calculate Deviasi (Proses - Plan)
  useEffect(() => {
    const plan = parseInt(planRenov, 10);
    const proses = parseInt(prosesRenov, 10);

    if (!isNaN(plan) && !isNaN(proses)) {
      const dev = proses - plan;
      setDeviasi(dev.toString());
    } else {
      setDeviasi("");
    }
  }, [planRenov, prosesRenov]);

  /**
   * Handler Simpan Data (Drafting)
   */
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    if (fileRekomRenovasi)
      formData.append("file_rekom_renovasi", fileRekomRenovasi);

    // Append controlled inputs
    formData.append("rekom_renovasi", rekomRenovasi);
    formData.append("bentuk_objek", bentukObjek);
    formData.append("tipe_toko", tipetoko);

    // Konstruksi payload untuk validasi Zod
    const payload = {
      kode_store: formData.get("kode_store") || undefined,
      tipe_toko: formData.get("tipe_toko") || undefined,
      bentuk_objek: formData.get("bentuk_objek") || undefined,
      rekom_renovasi: rekomRenovasi || undefined,
      tgl_rekom_renovasi: formData.get("tgl_rekom_renovasi") || undefined,
      start_spk_renov: formData.get("start_spk_renov") || undefined,
      end_spk_renov: formData.get("end_spk_renov") || undefined,
      plan_renov: planRenov === "" ? undefined : Number(planRenov),
      proses_renov: prosesRenov === "" ? undefined : Number(prosesRenov),
      deviasi: deviasi === "" ? undefined : Number(deviasi),
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

    // Pastikan nilai numeric yang dihitung ikut terkirim dalam FormData
    formData.set("plan_renov", planRenov);
    formData.set("proses_renov", prosesRenov);
    formData.set("deviasi", deviasi);

    try {
      const method = initialData ? "PATCH" : "POST";
      const res = await fetch(`/api/progress/${progressId}/renovasi`, {
        method,
        body: formData, // Kirim sebagai multipart/form-data
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
        message: `Data Renovasi berhasil di${
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
      title="Renovasi"
      icon={<Wrench className="text-orange-500 mr-3" size={20} />}
    >
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* --- Input Fields --- */}
        <div>
          <label
            htmlFor="nama_store"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Nama Toko
          </label>
          <Input
            id="nama_store"
            name="nama_store"
            type="text"
            placeholder="Masukkan nama store"
            defaultValue={initialData?.nama_store || ""}
          />
        </div>

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
            placeholder="Masukkan kode store"
            defaultValue={initialData?.kode_store || ""}
          />
        </div>

        <CustomSelect
          id="tipe_toko"
          name="tipe_toko"
          label="Tipe Toko"
          placeholder="Pilih Tipe"
          value={tipetoko}
          options={tipetokoOptions}
          onChange={(e) => setTipeToko(e.target.value)}
        />

        <CustomSelect
          id="bentuk_objek"
          name="bentuk_objek"
          label="Bentuk Objek"
          placeholder="Pilih Objek"
          value={bentukObjek}
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

        {/* Input Persentase Plan & Proses */}
        <div>
          <label
            htmlFor="plan_renov"
            className="block font-semibold text-base lg:text-lg mb-2"
          >
            Plan Renovasi (%)
          </label>
          <Input
            id="plan_renov"
            name="plan_renov"
            inputMode="numeric"
            value={planRenov}
            onChange={(e) =>
              handlePercentageChange(e.target.value, setPlanRenov)
            }
            placeholder="0-100"
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
            inputMode="numeric"
            value={prosesRenov}
            onChange={(e) =>
              handlePercentageChange(e.target.value, setProsesRenov)
            }
            placeholder="0-100"
          />
        </div>

        {/* Deviasi (Read Only - Calculated) */}
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
            value={deviasi}
            readOnly
            className="bg-gray-100"
            placeholder="Deviasi"
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

        {/* Input File */}
        <FormFileInput
          label="File Rekom Renovasi"
          name="file_rekom_renovasi"
          currentFile={filesMap.get("file_rekom_renovasi")}
          isFileSelected={!!fileRekomRenovasi}
          onChange={(e) => setFileRekomRenovasi(e.target.files?.[0] || null)}
        />

        {/* Action Buttons */}
        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
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

// Komponen Helper Read-Only Field
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

interface RenovasiProgressCardProps {
  progressId: string;
  onDataUpdate: () => void;
}

/**
 * Komponen Utama: RenovasiProgressCard
 * Mengatur tampilan (View/Edit), Approval, dan Modal History.
 */
const RenovasiProgressCard: React.FC<RenovasiProgressCardProps> = ({
  progressId,
  onDataUpdate,
}) => {
  const { data, loading, error, refetch } = useRenovasiProgress(progressId);
  // Fetch file terkait renovasi
  const {
    filesMap,
    loading: loadingFiles,
    error: errorFiles,
    refresh: refreshFiles,
  } = useFile("renovasi", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  const { user } = useUser();
  const isBranchAdmin = user?.position_nama === "admin branch";

  // Formatter Tanggal
  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  /**
   * Handler Finalisasi (Approval)
   * Status "Selesai" (Submit) atau "Batal" (Reject).
   */
  const handleFinalizeRenovasi = async (status: "Selesai" | "Batal") => {
    const actionText = status === "Selesai" ? "submit" : "batalkan";
    const actionTitle = status === "Selesai" ? "Submit" : "Pembatalan";
    const confirmText = status === "Selesai" ? "Ya, Submit" : "Ya, Batalkan";

    const isConfirmed = await showConfirmation({
      title: `Konfirmasi ${actionTitle} Renovasi`,
      message: `Apakah Anda yakin ingin ${actionText} Renovasi ini? Data yang sudah di-${actionText} tidak dapat diubah kembali.`,
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
      const res = await fetch(`/api/progress/${progressId}/renovasi/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_status_renov: apiStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorMsg =
          json.detail || json.error || "Gagal melakukan " + actionText;
        let errorTitle = `Gagal melakukan ${actionText}`;

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
        message: `Renovasi berhasil di-${actionText}.`,
      });
      await refetch();
    } catch (err: any) {
      showToast({
        type: "error",
        message: `Gagal melakukan ${actionText}.`,
      });
    } finally {
      setIsSubmittingApprove(false);
      setIsSubmittingReject(false);
    }
  };

  /* --- KONDISI LOADING & ERROR --- */
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

  /* --- KONDISI EDIT MODE --- */
  if (!data || isEditing)
    return (
      <div className="w-full ">
        <RenovasiForm
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
    data.final_status_renov === "Selesai" ||
    data.final_status_renov === "Batal";

  /* --- KONDISI VIEW MODE (Read Only) --- */
  return (
    <div className="w-full ">
      <DetailCard
        title="Renovasi"
        icon={<Wrench className="text-orange-500" size={20} />}
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
          <DetailField label="Nama Store" value={data.nama_store} />
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

        {/* Action Buttons: Muncul jika admin branch & belum final */}
        {!isFinalized && isBranchAdmin && (
          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              disabled={isSubmittingApprove || isSubmittingReject} //
              className="mr-auto"
            >
              <Pencil className="mr-2" size={16} /> Edit
            </Button>

            <Button
              variant="default"
              onClick={() => handleFinalizeRenovasi("Batal")} //
              disabled={isSubmittingApprove || isSubmittingReject} //
            >
              {isSubmittingReject ? ( //
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <XCircle className="mr-2" size={16} />
              )}
              Batal
            </Button>

            <Button
              type="submit"
              variant="submit"
              onClick={() => handleFinalizeRenovasi("Selesai")} //
              disabled={isSubmittingApprove || isSubmittingReject} //
            >
              {isSubmittingApprove ? ( //
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <CheckCircle className="mr-2" size={16} />
              )}{" "}
              Submit
            </Button>
          </div>
        )}
      </DetailCard>

      {/* Modal Riwayat */}
      {showHistoryModal && (
        <RenovasiHistoryModal
          progressId={progressId}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

export default RenovasiProgressCard;
