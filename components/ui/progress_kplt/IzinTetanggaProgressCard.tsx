// components/ui/progress_kplt/IzinTetanggaProgressCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useIzinTetanggaProgress } from "@/hooks/progress_kplt/useIzinTetanggaProgress";
import {
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ITEditableSchema } from "@/lib/validations/izin_tetangga";
import { useAlert } from "@/components/shared/alertcontext";
import { useFile, ApiFile } from "@/hooks/progress_kplt/useFilesProgress";
import { useUser } from "@/hooks/useUser";

/**
 * Helper: Menambahkan pemisah ribuan (titik) pada string angka.
 * Contoh: "1000000" -> "1.000.000"
 */
const formatnumeric = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === "") return "";
  const numberValue =
    typeof value === "string"
      ? Number(value.replace(/\./g, ""))
      : Number(value);
  if (isNaN(numberValue)) return "";
  return new Intl.NumberFormat("id-ID").format(numberValue);
};

/**
 * Helper: Menghapus pemisah ribuan untuk dikirim ke API / kalkulasi.
 * Contoh: "1.000.000" -> 1000000
 */
const unformatnumeric = (value: string | undefined | null) => {
  if (!value) return undefined;
  const unformatted = value.replace(/\./g, "");
  const numberValue = Number(unformatted);
  return isNaN(numberValue) ? undefined : numberValue;
};

/**
 * Komponen UI Wrapper untuk Kartu Detail
 */
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

/**
 * Komponen UI untuk menampilkan Link File atau status kosong.
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

interface FormProps {
  progressId: string;
  onSuccess: () => void;
  initialData?: any;
  onCancelEdit?: () => void;
  onDataUpdate: () => void;
  currentFileIzin: ApiFile | undefined;
  currentFileBukti: ApiFile | undefined;
}

/**
 * Komponen Form: IzinTetanggaForm
 * Menangani Input Data (Tanggal, Nominal) dan Upload File.
 */
const IzinTetanggaForm: React.FC<FormProps> = ({
  progressId,
  onSuccess,
  initialData,
  onCancelEdit,
  currentFileIzin,
  currentFileBukti,
  onDataUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useAlert();

  // State untuk file baru yang akan diupload
  const [fileIzin, setFileIzin] = useState<File | null>(null);
  const [fileBukti, setFileBukti] = useState<File | null>(null);

  // State tampilan nominal (terformat)
  const [displayNominal, setDisplayNominal] = useState<string>("");

  // Set initial value nominal saat edit mode
  useEffect(() => {
    if (initialData) {
      setDisplayNominal(formatnumeric(initialData.nominal));
    }
  }, [initialData]);

  // Handler input angka agar hanya menerima digit
  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const { value } = e.target;
    const rawValue = value.replace(/\./g, ""); // Hapus titik lama
    if (!/^\d*$/.test(rawValue)) return; // Validasi regex angka only

    setter(formatnumeric(rawValue)); // Format ulang dengan titik
  };

  /**
   * Handler Simpan Data (Drafting)
   * Menggunakan FormData karena melibatkan file upload.
   */
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Append file hanya jika user memilih file baru
    if (fileIzin) formData.append("file_izin_tetangga", fileIzin);
    if (fileBukti) formData.append("file_bukti_pembayaran", fileBukti);

    // Bersihkan format nominal sebelum dikirim (hapus titik)
    const nominalUnformatted = unformatnumeric(displayNominal);
    formData.set(
      "nominal",
      nominalUnformatted !== undefined ? String(nominalUnformatted) : ""
    );

    // Validasi payload non-file menggunakan Zod
    const payload = {
      tanggal_terbit: formData.get("tanggal_terbit") || undefined,
      nominal: nominalUnformatted,
    };
    const parsed = ITEditableSchema.partial().safeParse(payload);

    if (!parsed.success) {
      showToast({
        type: "error",
        message: "Data tidak valid. Mohon periksa kembali input Anda.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const method = initialData ? "PATCH" : "POST";
      // Kirim formData (bukan JSON) karena ada file
      const res = await fetch(`/api/progress/${progressId}/izin_tetangga`, {
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
        message: `Data Izin Tetangga berhasil di${
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
      title="Ijin Tetangga"
      icon={<Users className="text-red-500 mr-3" size={20} />}
    >
      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Input tanggal & nominal */}
        <div>
          <label className="block font-semibold mb-2">Tanggal Terbit</label>
          <Input
            id="tanggal_terbit"
            name="tanggal_terbit"
            type="date"
            defaultValue={initialData?.tanggal_terbit || ""}
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Nominal (Rp)</label>
          <Input
            id="nominal"
            name="nominal"
            inputMode="numeric"
            value={displayNominal}
            onChange={(e) => handleNumericInputChange(e, setDisplayNominal)}
            placeholder="Masukkan nominal"
          />
        </div>

        {/* File Izin Tetangga */}
        <div className="md:col-span-2">
          <label className="block font-semibold mb-2">File Izin Tetangga</label>
          {/* Tampilkan link file lama jika ada */}
          {currentFileIzin && !fileIzin && (
            <div className="mb-3">
              <FileLink label={currentFileIzin.name} file={currentFileIzin} />
            </div>
          )}
          <Input
            type="file"
            onChange={(e) => setFileIzin(e.target.files?.[0] || null)}
          />
        </div>

        {/* File Bukti Pembayaran */}
        <div className="md:col-span-2">
          <label className="block font-semibold mb-2">
            File Bukti Pembayaran
          </label>
          {currentFileBukti && !fileBukti && (
            <div className="mb-3">
              <FileLink label={currentFileBukti.name} file={currentFileBukti} />
            </div>
          )}
          <Input
            type="file"
            onChange={(e) => setFileBukti(e.target.files?.[0] || null)}
          />
        </div>

        {/* Action Buttons (Batal & Simpan) */}
        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
          {onCancelEdit && (
            <Button
              onClick={onCancelEdit}
              variant="default"
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

interface IzinTetanggaProgressCardProps {
  progressId: string;
  onDataUpdate: () => void;
}

/**
 * Komponen Utama: IzinTetanggaProgressCard
 * Mengatur tampilan View/Edit, Fetching Data, dan Approval Final.
 */
const IzinTetanggaProgressCard: React.FC<IzinTetanggaProgressCardProps> = ({
  progressId,
  onDataUpdate,
}) => {
  // Fetch data progress utama
  const { data, loading, error, refetch } = useIzinTetanggaProgress(progressId);
  // Fetch list file terkait (menggunakan custom hook useFile)
  const {
    filesMap,
    loading: fileLoading,
    refresh: refreshFiles,
  } = useFile("izin_tetangga", progressId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);
  const { showToast, showConfirmation } = useAlert();

  // RBAC: Cek apakah user adalah Admin Branch
  const { user } = useUser();
  const isBranchAdmin = user?.position_nama === "admin branch";

  // Ambil file spesifik dari Map
  const fileIzinTetangga = filesMap.get("file_izin_tetangga");
  const fileBuktiPembayaran = filesMap.get("file_bukti_pembayaran");

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

  /**
   * Handler untuk Finalisasi Status (Approval).
   * Bisa "Selesai" (Submit) atau "Batal" (Reject).
   * Setelah ini data akan terkunci (tidak bisa diedit).
   */
  const handleFinalizeIT = async (status: "Selesai" | "Batal") => {
    const actionText = status === "Selesai" ? "submit" : "batalkan";
    const actionTitle = status === "Selesai" ? "Submit" : "Pembatalan";
    const confirmText = status === "Selesai" ? "Ya, Submit" : "Ya, Batalkan";

    // Konfirmasi User
    const isConfirmed = await showConfirmation({
      title: `Konfirmasi ${actionTitle} Izin Tetangga`,
      message: `Apakah Anda yakin ingin ${actionText} Izin Tetangga ini? Data yang sudah di-${actionText} tidak dapat diubah kembali.`,
      confirmText: confirmText,
      type: "warning",
    });

    if (!isConfirmed) return;

    // Set loading state sesuai tombol yang ditekan
    if (status === "Selesai") {
      setIsSubmittingApprove(true);
    } else {
      setIsSubmittingReject(true);
    }

    try {
      const apiStatus = status.toLowerCase() as "selesai" | "batal";
      const res = await fetch(
        `/api/progress/${progressId}/izin_tetangga/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ final_status_it: apiStatus }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        // Handle error spesifik dari backend
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
        message: `Izin Tetangga berhasil di-${actionText}.`,
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

  /* --- KONDISI LOADING & ERROR --- */
  if (loading || fileLoading)
    return (
      <div className="flex justify-center py-10 mt-8 w-full">
        <Loader2 className="animate-spin text-gray-500" size={28} />
      </div>
    );

  if (error)
    return (
      <div className="text-red-500 text-center py-5 mt-8 w-full">
        Terjadi kesalahan: {error}
      </div>
    );

  /* --- KONDISI EDIT MODE --- */
  if (!data || isEditing) {
    return (
      <div className="w-full">
        <IzinTetanggaForm
          progressId={progressId}
          onSuccess={() => {
            refetch();
            refreshFiles();
            setIsEditing(false);
          }}
          initialData={data}
          onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
          currentFileIzin={fileIzinTetangga}
          currentFileBukti={fileBuktiPembayaran}
          onDataUpdate={onDataUpdate}
        />
      </div>
    );
  }

  // Cek apakah status sudah final
  const isFinalized =
    data.final_status_it === "Selesai" || data.final_status_it === "Batal";

  /* --- KONDISI VIEW MODE (Read Only) --- */
  return (
    <div className="w-full">
      <DetailCard
        title="Ijin Tetangga"
        icon={<Users className="text-red-500 mr-3" size={20} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Tanggal Terbit
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              {formatDate(data.tanggal_terbit) || "-"}
            </div>
          </div>

          <div>
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Nominal (Rp)
            </h3>
            <div className="bg-gray-100 rounded-md px-4 py-2 text-base">
              Rp {data.nominal?.toLocaleString("id-ID") || "-"}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="block font-semibold text-base lg:text-lg mb-2">
              Dokumen
            </h3>
            <div className="space-y-3">
              <FileLink label="File Izin Tetangga" file={fileIzinTetangga} />
              <FileLink
                label="File Bukti Pembayaran"
                file={fileBuktiPembayaran}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Hanya muncul jika admin branch & belum final */}
        {!isFinalized && isBranchAdmin && (
          <div className="flex gap-3 mt-6">
            {/* Tombol Edit: Pindah ke Edit Mode */}
            <Button
              variant="secondary" // Ganti variant agar konsisten
              onClick={() => setIsEditing(true)}
              disabled={isSubmittingApprove || isSubmittingReject} //
              className="mr-auto" // Pindahkan ke kiri
            >
              <Pencil className="mr-2" size={16} /> Edit
            </Button>

            {/* Tombol Batal: Finalisasi dengan status Batal */}
            <Button
              variant="default"
              onClick={() => handleFinalizeIT("Batal")} //
              disabled={isSubmittingApprove || isSubmittingReject} //
            >
              {isSubmittingReject ? ( //
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <XCircle className="mr-2" size={16} />
              )}
              Batal
            </Button>

            {/* Tombol Submit: Finalisasi dengan status Selesai */}
            <Button
              type="submit"
              variant="submit"
              onClick={() => handleFinalizeIT("Selesai")} //
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
    </div>
  );
};

export default IzinTetanggaProgressCard;
