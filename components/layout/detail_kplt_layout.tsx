"use client";

/**
 * DetailKpltLayout
 * ----------------
 * Layout UI utama untuk menampilkan detail data KPLT (Kajian Potensi Lokasi Toko).
 * Komponen ini berfungsi sebagai presentational layer yang menerima data dan handler dari page parent.
 *
 * Fitur Utama:
 * - Menampilkan informasi detail KPLT (Header & Analisis Kelayakan).
 * - Menampilkan kartu khusus untuk input data "Intip" dan "Form Ukur" (khusus Location Manager).
 * - Menampilkan daftar file dokumen pendukung (PDF/Excel/Video).
 * - Menampilkan riwayat persetujuan (Approval Logs).
 * - Menyediakan tombol aksi Approval (Setuju/Tolak) untuk Manager.
 * - Menangani logika display modal input menggunakan `createPortal`.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Link as LinkIcon,
  FileText,
  Sheet,
  Video,
  FileQuestion,
  Loader2,
  ClipboardList,
  UploadCloud,
  CheckCircle,
  XCircle,
  History,
  Loader,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MappedKpltDetail, ApprovalDetail } from "@/hooks/kplt/useKpltDetail";
import { useKpltFiles, MappedKpltFile } from "@/hooks/kplt/useKpltfile";
import PrefillKpltCard from "../ui/prefillkpltcard";
import { ApprovalStatusbutton } from "../ui/approvalbutton";
import DetailKpltSkeleton from "../ui/skleton";
import InputIntipForm from "../ui/inputintip";
import InputFormUkur from "../ui/inputformukur";
import { useMemo } from "react";
import { createPortal } from "react-dom";

/**
 * Komponen pembantu untuk menampilkan Label dan Value dalam kotak abu-abu.
 */
const DetailField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <label className="text-gray-600 font-medium text-sm lg:text-base mb-1 block">
      {label}
    </label>
    <div className="text-gray-900 py-2 text-sm bg-gray-100 rounded-lg px-3 min-h-[40px] flex items-center w-full break-words">
      {value || "-"}
    </div>
  </div>
);

/**
 * Komponen pembantu untuk menampilkan link file dengan tombol "Lihat".
 */
const FileLink = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return null;
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

/**
 * Helper untuk memformat nama field file menjadi label yang mudah dibaca.
 * Contoh: "file_surat_ijin" -> "File Surat Ijin"
 */
const generateLabel = (field: string | null): string => {
  if (!field) return "File Lainnya";
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Helper untuk menentukan ikon berdasarkan tipe file.
 */
const getIconForFileType = (fileType: MappedKpltFile["fileType"]) => {
  switch (fileType) {
    case "pdf":
      return <FileText className="w-6 h-6 text-red-600 flex-shrink-0" />;
    case "excel":
      return <Sheet className="w-6 h-6 text-green-600 flex-shrink-0" />;
    case "video":
      return <Video className="w-6 h-6 text-blue-600 flex-shrink-0" />;
    default:
      return <FileQuestion className="w-6 h-6 text-gray-500 flex-shrink-0" />;
  }
};

/**
 * Komponen item list untuk daftar file dokumen pendukung.
 */
const FileListItem = ({ file }: { file: MappedKpltFile }) => {
  const label = generateLabel(file.field);

  return (
    <a
      href={file.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
    >
      {getIconForFileType(file.fileType)}
      <div className="flex flex-col flex-grow">
        <p className="font-semibold text-sm text-gray-800 leading-tight break-words">
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {file.sizeFormatted} &bull; {file.lastModifiedFormatted}
        </p>
      </div>
      <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
    </a>
  );
};

/**
 * Wrapper Card standar untuk setiap bagian detail.
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
    {/* Header Kartu */}
    <div className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
    {/* Konten Kartu */}
    <div className="p-6">{children}</div>
  </div>
);

/**
 * Helper format tanggal untuk log approval.
 */
const formatLogDate = (isoDate: string | null): string => {
  if (!isoDate) return "-";
  try {
    return new Date(isoDate).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "-";
  }
};

/**
 * Komponen untuk menampilkan satu item dalam riwayat persetujuan
 */
const ApprovalLogItem = ({ approval }: { approval: ApprovalDetail }) => {
  const isApproved = approval.is_approved;
  const statusText = isApproved ? "Disetujui" : "Ditolak";
  const statusColor = isApproved ? "text-green-600" : "text-red-600";
  const Icon = isApproved ? CheckCircle : XCircle;
  const bgColor = isApproved ? "bg-green-50" : "bg-red-50";
  const borderColor = isApproved ? "border-green-200" : "border-red-200";

  return (
    <div
      className={`flex items-start p-4 rounded-lg border ${bgColor} ${borderColor}`}
    >
      <Icon className={`w-6 h-6 ${statusColor} mr-4 mt-1 flex-shrink-0`} />
      <div className="flex-grow">
        <p className="font-semibold text-gray-800">{approval.position_nama}</p>
        <p className={`text-sm font-medium ${statusColor}`}>{statusText}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatLogDate(approval.approved_at)}
        </p>
      </div>
    </div>
  );
};

/**
 * Interface untuk Card Input Data (Intip & Form Ukur).
 */
interface DataInputCardProps {
  title: string;
  icon: React.ReactNode;
  statusValue?: string | null;
  statusLabel?: string;
  dateValue?: string | null;
  dateLabel?: string;
  fileUrl?: string | null;
  fileLabel?: string;
  hasData: boolean;
  emptyMessage: string;
  caninput: boolean;
  onInputClick: () => void;
  buttonLabel: string;
  showUpdateButton?: boolean;
  disabledMessage?: string;
}

/**
 * Komponen Card yang menangani dua kondisi:
 * 1. Data Kosong: Menampilkan pesan kosong dan tombol input (jika punya akses).
 * 2. Data Ada: Menampilkan detail data tersebut.
 */
const DataInputCard = ({
  title,
  icon,
  statusValue,
  statusLabel = "Status",
  dateValue,
  dateLabel = "Tanggal",
  fileUrl,
  fileLabel = "File",
  hasData,
  emptyMessage,
  caninput,
  onInputClick,
  buttonLabel,
  disabledMessage,
}: DataInputCardProps) => {
  const fieldCount = [statusValue, dateValue].filter(Boolean).length;
  const gridClass =
    fieldCount === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  return (
    <DetailCard title={title} icon={icon} className="mt-10">
      <div className="space-y-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
              <FileQuestion className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Data Tidak Ditemukan
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
              {emptyMessage}
            </p>

            {caninput && (
              <Button onClick={onInputClick} variant="default">
                <UploadCloud className="w-5 h-5" />
                {buttonLabel}
              </Button>
            )}

            {!caninput && disabledMessage && (
              <div className="mt-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700 text-center">
                  {disabledMessage}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`grid ${gridClass} gap-4`}>
              {statusValue && (
                <DetailField label={statusLabel} value={statusValue} />
              )}
              {dateValue && <DetailField label={dateLabel} value={dateValue} />}
            </div>

            <div className="mt-4">
              {fileUrl ? (
                <FileLink label={fileLabel} url={fileUrl} />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 italic">
                    ⚠️ {fileLabel} belum diupload
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DetailCard>
  );
};

/**
 * Interface Props Utama Layout
 */
interface DetailKpltLayoutProps {
  id: string;
  data?: MappedKpltDetail;
  isLoading: boolean;
  isError: boolean;
  showApprovalSection: boolean;
  isAlreadyApproved: boolean;
  isApproving: boolean;
  onApprove: (status: "OK" | "NOK") => void;
  isLocationManager: boolean;
  onOpenIntipModal: () => void;
  onOpenFormUkurModal: () => void;
  showIntipModal: boolean;
  onCloseIntipModal: () => void;
  onIntipSubmit: (formData: FormData) => Promise<void>;
  showFormUkurModal: boolean;
  onCloseFormUkurModal: () => void;
  onFormUkurSubmit: (formData: FormData) => Promise<void>;
  isSubmittingLmInput: boolean;
}

export default function DetailKpltLayout({
  id,
  data,
  isLoading,
  isError,
  showApprovalSection,
  isAlreadyApproved,
  isApproving,
  onApprove,
  isLocationManager,
  onOpenIntipModal,
  onOpenFormUkurModal,
  showIntipModal,
  onCloseIntipModal,
  onIntipSubmit,
  showFormUkurModal,
  onCloseFormUkurModal,
  onFormUkurSubmit,
  isSubmittingLmInput,
}: DetailKpltLayoutProps) {
  const router = useRouter();

  /**
   * Mengambil daftar file tambahan menggunakan hook.
   */
  const {
    files,
    isLoading: isLoadingFiles,
    isError: isFilesError,
  } = useKpltFiles(id);

  /**
   * Memfilter file list untuk MENGECUALIKAN 'file_intip' dan 'form_ukur'.
   * Alasannya: kedua file ini sudah ditampilkan di Card khususnya masing-masing,
   * jadi tidak perlu ditampilkan ulang di bagian "Dokumen Terlampir Lainnya".
   */
  const filteredOtherFiles = useMemo(() => {
    if (!files) return [];
    return files.filter(
      (file) => file.field !== "file_intip" && file.field !== "form_ukur"
    );
  }, [files]);

  /**
   * Render Loading Skeleton.
   */
  if (isLoading || (isLoadingFiles && !isError && !isFilesError)) {
    return <DetailKpltSkeleton />;
  }

  /**
   * Render Error State.
   */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        {/* ... Tampilan Error ... */}
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8 max-w-md">
          <div className="text-red-500 text-5xl lg:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data Utama
          </h3>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Terjadi kesalahan saat mengambil detail KPLT. Silakan coba lagi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full lg:w-auto"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  const showFilesError = !isLoadingFiles && isFilesError;

  /**
   * Render Data Not Found State.
   */
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        {/* ... Tampilan Data Tidak Ditemukan ... */}
        <div className="text-gray-300 text-5xl lg:text-6xl mb-4">❓</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Data KPLT Tidak Ditemukan
        </h3>
        <p className="text-gray-500 text-sm lg:text-base">
          Data KPLT dengan ID ini tidak ditemukan atau Anda tidak memiliki
          akses.
        </p>
        <Button onClick={() => router.back()} variant="back" className="mt-6">
          Kembali
        </Button>
      </div>
    );
  }

  const { base, analytics } = data;

  // Validasi apakah Location Manager boleh mengedit data
  const canLmEdit =
    isLocationManager && data.base.kpltapproval === "In Progress";

  // Validasi kelengkapan data sebelum tombol approval muncul
  const isFormUkurFilled = !!base.formUkurUrl;
  const isFileIntipFilled = !!base.fileIntipUrl;
  const canShowApprovalButton = isFormUkurFilled && isFileIntipFilled;

  return (
    <main className="space-y-4 lg:space-y-6">
      <div className="max-w-7xl mx-auto">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="back"
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>

        {/* Header & Informasi Dasar (Prefill) */}
        <div className="mb-10">
          {data && (
            <PrefillKpltCard baseData={base} approvalsData={data.approvals} />
          )}
        </div>

        {/* Kartu Analisis Kelayakan */}
        <DetailCard
          title="Analisis Kelayakan Lokasi"
          icon={<ClipboardList className="text-red-500 mr-3" size={20} />}
          className="mt-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <DetailField
              label="Karakter Lokasi"
              value={analytics.karakterLokasi}
            />
            <DetailField
              label="Sosial Ekonomi"
              value={analytics.sosialEkonomi}
            />
            <DetailField label="Skor FPL" value={analytics.scoreFpl} />
            <DetailField label="STD" value={analytics.std} />
            <DetailField label="APC" value={analytics.apc} />
            <DetailField label="SPD" value={analytics.spd} />
            <DetailField label="PE Status" value={analytics.peStatus} />
            <DetailField
              label="PE RAB"
              value={`Rp ${analytics.peRab?.toLocaleString("id-ID") ?? "-"}`}
            />
          </div>
        </DetailCard>

        {/* Card INTIP - hanya untuk Location Manager */}
        <DataInputCard
          title="Data Intip"
          icon={<CheckCircle className="text-red-500 mr-3" size={20} />}
          statusValue={base.approvalIntipStatus}
          statusLabel="Status Approval Intip"
          dateValue={base.tanggalApprovalIntip}
          dateLabel="Tanggal Approval Intip"
          fileUrl={base.fileIntipUrl}
          fileLabel="Bukti Approval INTIP"
          hasData={
            !!(
              base.approvalIntipStatus ||
              base.fileIntipUrl ||
              base.tanggalApprovalIntip
            )
          }
          emptyMessage="Belum ada data INTIP yang tersimpan untuk lokasi ini."
          caninput={isLocationManager && canLmEdit}
          onInputClick={onOpenIntipModal}
          buttonLabel="Input Data INTIP"
          showUpdateButton={true}
        />

        {/* Card Form Ukur - hanya untuk Location Manager */}
        <DataInputCard
          title="Form Ukur Lokasi"
          icon={<FileText className="text-red-500 mr-3" size={20} />}
          dateValue={base.tanggalUkur}
          dateLabel="Tanggal Ukur"
          fileUrl={base.formUkurUrl}
          fileLabel="Formulir Ukur"
          hasData={!!(base.formUkurUrl || base.tanggalUkur)}
          emptyMessage="Belum ada Form Ukur yang diupload untuk lokasi ini."
          caninput={canLmEdit}
          onInputClick={onOpenFormUkurModal}
          buttonLabel="Input Form Ukur"
          showUpdateButton={true}
        />

        {/* Kartu Dokumen Terlampir Lainnya */}
        <DetailCard
          title="Dokumen Terlampir Lainnya"
          icon={<FileText className="text-red-500 mr-3" size={20} />}
          className="mt-10"
        >
          {showFilesError ? (
            <div className="col-span-full text-center py-10 text-red-600 bg-red-50 rounded-lg">
              Gagal memuat daftar dokumen terlampir.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingFiles ? (
                <div className="col-span-full flex justify-center items-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  <p className="ml-3 text-gray-600">Memuat daftar dokumen...</p>
                </div>
              ) : filteredOtherFiles && filteredOtherFiles.length > 0 ? (
                filteredOtherFiles.map((file) => (
                  <FileListItem key={file.name} file={file} />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  Tidak ada dokumen tambahan yang dilampirkan.
                </div>
              )}
            </div>
          )}
        </DetailCard>

        {/* Riwayat Persetujuan */}
        <DetailCard
          title="Riwayat Persetujuan"
          icon={<History className="text-red-500 mr-3" size={20} />}
          className="mt-10"
        >
          {data.approvals && data.approvals.length > 0 ? (
            <div className="space-y-4">
              {data.approvals
                .sort(
                  (a, b) =>
                    new Date(b.approved_at).getTime() -
                    new Date(a.approved_at).getTime()
                ) // Urutkan: terbaru di atas
                .map((approval) => (
                  <ApprovalLogItem key={approval.id} approval={approval} />
                ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              Belum ada riwayat persetujuan untuk lokasi ini.
            </div>
          )}
        </DetailCard>

        {/* Tombol Approval (BM/RM/GM) */}
        {showApprovalSection && !isAlreadyApproved && canShowApprovalButton && (
          <div className="mt-6">
            <ApprovalStatusbutton
              show={true}
              disabled={isApproving}
              onApprove={onApprove}
              fileUploaded={true}
              loading={isApproving}
              currentStatus={data.base.kpltapproval ?? null}
            />
          </div>
        )}
      </div>

      {/* Modal Input Intip */}
      {showIntipModal &&
        typeof document !== "undefined" &&
        createPortal(
          <InputIntipForm
            onSubmit={onIntipSubmit}
            onClose={onCloseIntipModal}
            isSubmitting={isSubmittingLmInput}
          />,
          document.body
        )}

      {/* Modal Input Form Ukur */}
      {showFormUkurModal &&
        createPortal(
          <InputFormUkur
            onSubmit={onFormUkurSubmit}
            onClose={onCloseFormUkurModal}
            isSubmitting={isSubmittingLmInput}
          />,
          document.body
        )}
    </main>
  );
}
