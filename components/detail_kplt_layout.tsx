"use client";

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
  ClipboardList, // <-- Tambahkan import ini untuk ikon analisis
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MappedKpltDetail } from "@/hooks/useKpltDetail";
import { useKpltFiles, MappedKpltFile } from "@/hooks/useKpltfile";
import PrefillKpltCard from "./ui/prefillkpltcard";
import { ApprovalStatusbutton } from "./ui/approvalbutton";
import DetailKpltSkeleton from "./ui/skleton";

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

// --- [BARU] Komponen Card Internal Sesuai Gaya yang Diinginkan ---
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

// --- Interface Utama (Tidak berubah) ---
interface DetailKpltLayoutProps {
  id: string;
  data?: MappedKpltDetail;
  isLoading: boolean;
  isError: boolean;
  showApprovalSection: boolean;
  isAlreadyApproved: boolean;
  isApproving: boolean;
  onApprove: (status: "OK" | "NOK") => void;
}

// --- Komponen Utama ---
export default function DetailKpltLayout({
  id,
  data,
  showApprovalSection,
  isApproving,
  isLoading,
  isError,
  isAlreadyApproved,
  onApprove,
}: DetailKpltLayoutProps) {
  const router = useRouter();

  const {
    files,
    isLoading: isLoadingFiles,
    isError: isFilesError,
  } = useKpltFiles(id);

  if (isLoading || isLoadingFiles) {
    return <DetailKpltSkeleton />;
  }
  if (isError || isFilesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 lg:p-8 max-w-md">
          <div className="text-red-500 text-5xl lg:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 text-sm lg:text-base mb-4">
            Terjadi kesalahan saat mengambil data. Silakan coba lagi.
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
  if (!data) {
    return <DetailKpltSkeleton />;
  }

  const { base, analytics } = data;

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
        <div className="mb-10 ">{data && <PrefillKpltCard data={base} />}</div>

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
            <DetailField label="PE RAB" value={analytics.peRab} />
          </div>
        </DetailCard>

        <DetailCard
          title="Dokumen Terlampir"
          icon={<FileText className="text-red-500 mr-3" size={20} />}
          className="mt-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingFiles && (
              <div className="col-span-full flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                <p className="ml-3 text-gray-600">Memuat daftar dokumen...</p>
              </div>
            )}
            {isFilesError && (
              <div className="col-span-full text-center py-10 text-red-600 bg-red-50 rounded-lg">
                Gagal memuat daftar dokumen.
              </div>
            )}
            {!isLoadingFiles &&
              !isFilesError &&
              (files && files.length > 0 ? (
                files.map((file) => (
                  <FileListItem key={file.name} file={file} />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  Tidak ada dokumen yang dilampirkan.
                </div>
              ))}
          </div>
        </DetailCard>

        {showApprovalSection && !isAlreadyApproved && (
          <div className="mt-6">
            <ApprovalStatusbutton
              show={true}
              disabled={isApproving}
              onApprove={onApprove}
              fileUploaded={true}
              loading={isApproving}
              currentStatus={null}
            />
          </div>
        )}
      </div>
    </main>
  );
}
