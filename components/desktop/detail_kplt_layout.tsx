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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MappedKpltDetail, ApprovalsSummary } from "@/hooks/useKpltDetail";
import { useKpltFiles, MappedKpltFile } from "@/hooks/useKpltfile";
import PrefillKpltCard from "../ui/prefillkpltcard";
import { ApprovalStatusbutton } from "../ui/approvalbutton";
import { useUser } from "@/hooks/useUser";

// Props untuk komponen ini, hanya menerima 'data'
interface DetailKpltLayoutProps {
  id: string;
  data: MappedKpltDetail; // Tipe data sesuai respons API fn_kplt_detail
  showApprovalSection: boolean;
  isAlreadyApproved: boolean;
  isApproving: boolean;
  onApprove: (status: "OK" | "NOK") => void;
}

// Komponen kecil untuk menampilkan field key-value agar rapi
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

// Komponen kecil untuk menampilkan link ke file
// const FileLink = ({ label, url }: { label: string; url: string | null }) => {
//   if (!url) return <DetailField label={label} value="Tidak ada file" />;

//   return (
//     <div>
//       <label className="text-gray-600 font-medium text-sm mb-1 block">
//         {label}
//       </label>
//       <a
//         href={url}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border hover:bg-gray-100 transition-colors"
//       >
//         <span className="text-sm text-blue-600 font-semibold">
//           Lihat Dokumen
//         </span>
//         <LinkIcon className="w-4 h-4 text-gray-500" />
//       </a>
//     </div>
//   );
// };

const generateLabel = (field: string | null): string => {
  if (!field) return "File Lainnya";
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper untuk memilih ikon berdasarkan tipe file
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

const FileListItem = ({ file }: { file: MappedKpltFile }) => {
  const label = generateLabel(file.field);

  return (
    <a
      href={file.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
    >
      {/* Ikon berdasarkan tipe file */}
      {getIconForFileType(file.fileType)}

      {/* Detail File */}
      <div className="flex flex-col flex-grow">
        <p className="font-semibold text-sm text-gray-800 leading-tight break-words">
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {file.sizeFormatted} &bull; {file.lastModifiedFormatted}
        </p>
      </div>

      {/* Ikon Link Eksternal */}
      <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
    </a>
  );
};

export default function DetailKpltLayout({
  id,
  data,
  showApprovalSection, // Ambil prop ini
  isApproving, // Ambil prop ini
  isAlreadyApproved,
  onApprove, // Ambil prop ini
}: DetailKpltLayoutProps) {
  const router = useRouter();
  const { user } = useUser();

  const {
    files,
    isLoading: isLoadingFiles,
    isError: isFilesError,
  } = useKpltFiles(id);

  const canApprove =
    user &&
    (user.position_id === "branch manager" ||
      user.position_id === "regional manager" ||
      (user.position_nama &&
        ["branch manager", "regional manager"].includes(
          user.position_nama.toLowerCase()
        )));

  const { base, analytics, approvalsSummary } = data;

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

        {/* --- Bagian Analisis Kelayakan --- */}
        <div className="relative mt-10">
          <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow font-semibold text-base lg:text-lg">
            Analisis Kelayakan Lokasi
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>

        {/* --- Bagian Dokumen Terlampir --- */}
        <div className="relative mt-10">
          <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded shadow-md font-semibold">
            Dokumen Terlampir
          </div>
          <div className="bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl p-6 pt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>

        {showApprovalSection && canApprove && !isAlreadyApproved && (
          // 👇 PERUBAHAN DI SINI
          <div className="mt-6">
            <ApprovalStatusbutton
              show={true}
              disabled={isApproving} // Tombol disable saat loading
              onApprove={onApprove} // Langsung panggil prop onApprove
              fileUploaded={true}
              loading={isApproving} // Tampilkan spinner saat loading
              currentStatus={null}
            />

            {isAlreadyApproved && (
              <div className="bg-green-100 text-green-800 p-4 rounded-lg font-semibold border border-green-200">
                Anda sudah memberikan approval untuk KPLT ini.
                {/* Di sini nanti Anda bisa meletakkan komponen ApprovalSummary yang sebenarnya */}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
