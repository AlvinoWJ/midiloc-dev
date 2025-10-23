// components/detail_kplt_layout.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Link as LinkIcon, // Pastikan alias ini ada jika menggunakan 'Link' dari lucide-react
  FileText,
  Sheet,
  Video,
  FileQuestion,
  Loader2,
  ClipboardList,
  UploadCloud,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MappedKpltDetail } from "@/hooks/useKpltDetail";
import { useKpltFiles, MappedKpltFile } from "@/hooks/useKpltfile";
import PrefillKpltCard from "./ui/prefillkpltcard";
import { ApprovalStatusbutton } from "./ui/approvalbutton";
import DetailKpltSkeleton from "./ui/skleton";
import InputIntipForm from "./ui/inputintip";
import InputFormUkur from "./ui/inputformukur";

// --- Komponen DetailField (Tidak berubah) ---
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

// --- Komponen FileLink (Tambahkan jika belum ada atau gunakan struktur serupa) ---
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

// --- Helper Fungsi (Tidak berubah) ---
const generateLabel = (field: string | null): string => {
  if (!field) return "File Lainnya";
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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

// --- Komponen FileListItem (Tidak berubah) ---
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

// --- Komponen DetailCard (Tidak berubah) ---
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

// --- Interface Utama DIPERBARUI ---
interface DetailKpltLayoutProps {
  id: string;
  data?: MappedKpltDetail;
  isLoading: boolean;
  isError: boolean;
  showApprovalSection: boolean;
  isAlreadyApproved: boolean;
  isApproving: boolean;
  onApprove: (status: "OK" | "NOK") => void;
  // Props BARU untuk LM
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

// --- Komponen Utama DIPERBARUI ---
export default function DetailKpltLayout({
  id,
  data,
  isLoading,
  isError,
  showApprovalSection,
  isAlreadyApproved,
  isApproving,
  onApprove,
  // Props LM
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
  const {
    files,
    isLoading: isLoadingFiles,
    isError: isFilesError,
  } = useKpltFiles(id);

  // --- Handling Loading & Error (Tidak berubah) ---
  if (isLoading || (isLoadingFiles && !isError && !isFilesError)) {
    return <DetailKpltSkeleton />;
  }
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
  const canLmEdit =
    isLocationManager && data.base.kpltapproval === "In Progress";

  return (
    <main className="space-y-4 lg:space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Tombol Kembali */}
        <Button
          type="button"
          onClick={() => router.back()}
          variant="back"
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>

        {/* Kartu Prefill */}
        <div className="mb-10">{data && <PrefillKpltCard data={base} />}</div>

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

        {isLocationManager && (
          <DetailCard
            title="Form Ukur Lokasi"
            icon={<FileText className="text-red-500 mr-3" size={20} />}
            className="mt-10"
          >
            <div className="space-y-4">
              {base.formUkurUrl ? (
                <FileLink
                  label="Formulir Ukur Tersimpan"
                  url={base.formUkurUrl}
                />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Belum ada Form Ukur yang diupload.
                </p>
              )}

              {/* Tampilkan tanggal ukur jika ada */}
              {base.tanggalUkur && (
                <DetailField
                  label="Tanggal Ukur"
                  value={base.tanggalUkur} // Data sudah diformat di hook
                />
              )}
            </div>
          </DetailCard>
        )}

        {isLocationManager && (
          <DetailCard
            title="Data Intip"
            icon={<CheckCircle className="text-red-500 mr-3" size={20} />}
            className="mt-10"
          >
            <div className="space-y-4">
              {base.approvalIntipStatus && (
                <DetailField
                  label="Status Approval Intip"
                  value={base.approvalIntipStatus}
                />
              )}
              {base.tanggalApprovalIntip && (
                <DetailField
                  label="Tanggal Approval Intip"
                  value={base.tanggalApprovalIntip}
                />
              )}
              {base.fileIntipUrl ? (
                <FileLink label="File Intip" url={base.fileIntipUrl} />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Belum ada File Intip yang diupload.
                </p>
              )}
            </div>
          </DetailCard>
        )}

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
              ) : files && files.length > 0 ? (
                files
                  // Optional: Filter file intip dan form ukur jika tidak ingin duplikasi
                  // .filter(file => file.field !== 'file_intip' && file.field !== 'form_ukur')
                  .map((file) => <FileListItem key={file.name} file={file} />)
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  Tidak ada dokumen tambahan yang dilampirkan.
                </div>
              )}
            </div>
          )}
        </DetailCard>

        {/* Tombol Approval (BM/RM/GM) */}
        {showApprovalSection && !isAlreadyApproved && (
          <div className="mt-6">
            <ApprovalStatusbutton
              show={true}
              disabled={isApproving}
              onApprove={onApprove}
              fileUploaded={true} // Asumsikan file lain sudah ada jika sampai tahap ini
              loading={isApproving}
              currentStatus={data.base.kpltapproval ?? null}
            />
          </div>
        )}
      </div>

      {/* Modal Input Intip */}
      {showIntipModal && (
        <InputIntipForm
          onSubmit={onIntipSubmit}
          onClose={onCloseIntipModal}
          isSubmitting={isSubmittingLmInput}
        />
      )}

      {/* Modal Input Form Ukur */}
      {showFormUkurModal && (
        <InputFormUkur
          onSubmit={onFormUkurSubmit}
          onClose={onCloseFormUkurModal}
          isSubmitting={isSubmittingLmInput}
        />
      )}
    </main>
  );
}
