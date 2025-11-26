//detail_progress_kplt_layout.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import VerticalProgressTimeline, {
  ProgressStep,
} from "../ui/progress_kplt/VerticalTimeline";
import MouProgressCard from "@/components/ui/progress_kplt/MouProgressCard";
import IzinTetanggaProgressCard from "@/components/ui/progress_kplt/IzinTetanggaProgressCard";
import NotarisProgressCard from "@/components/ui/progress_kplt/NotarisProgressCard";
import PerizinanProgressCard from "@/components/ui/progress_kplt/PerizinanProgressCard";
import RenovasiProgressCard from "@/components/ui/progress_kplt/RenovasiProgressCard";
import GrandOpeningProgressCard from "@/components/ui/progress_kplt/GrandOpeningProgressCard";
import {
  ProgressData,
  TimelineItem,
} from "@/hooks/progress_kplt/useProgressDetail";
import { MappedModuleFile } from "@/hooks/useModuleFile";
import {
  ArrowLeft,
  ChevronDownIcon,
  FileText,
  Link as LinkIcon,
  Sheet,
  Video,
  Image,
  FileQuestion,
  Loader2,
} from "lucide-react";
import { CalendarIcon } from "@heroicons/react/24/solid";

interface LayoutProps {
  progressData: ProgressData;
  files: MappedModuleFile[] | undefined;
  isFilesError: any;
  currentMainStatus?: string;
  timeline: TimelineItem[];
  onDataUpdate: () => void;
}

const getFileIcon = (fileType: MappedModuleFile["fileType"]) => {
  switch (fileType) {
    case "pdf":
      return <FileText className="w-6 h-6 text-red-600" />;
    case "excel":
      return <Sheet className="w-6 h-6 text-green-600" />;
    case "video":
      return <Video className="w-6 h-6 text-blue-600" />;
    case "image":
      return <Image className="w-6 h-6 text-indigo-600" />;
    default:
      return <FileQuestion className="w-6 h-6 text-gray-500" />;
  }
};

const generateLabel = (field: string | null): string => {
  if (!field) return "File Lainnya";
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

const STEP_NAME_MAP: { [key: string]: string } = {
  mou: "MOU",
  izin_tetangga: "Ijin Tetangga",
  perizinan: "Perizinan",
  notaris: "Notaris",
  renovasi: "Renovasi",
  grand_opening: "Grand Opening",
};

const mapUiStatusToProgressStatus = (
  uiStatus: string | undefined | null
): ProgressStep["status"] => {
  switch (uiStatus) {
    case "done":
      return "Done";
    case "in_progress":
      return "In Progress";
    case "batal":
      return "Batal";
    case "pending":
    default:
      return "Pending";
  }
};

const STEP_ORDER = [
  "mou",
  "izin_tetangga",
  "perizinan",
  "notaris",
  "renovasi",
  "grand_opening",
];

export default function DetailProgressKpltLayout({
  progressData,
  files,
  isFilesError,
  currentMainStatus,
  timeline,
  onDataUpdate,
}: LayoutProps) {
  const router = useRouter();
  const { kplt } = progressData;
  const [isExpanded, setIsExpanded] = useState(false);

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const progressId = progressData.id;

  const steps: ProgressStep[] = useMemo(() => {
    return STEP_ORDER.map((stepKey, index) => {
      const timelineData = timeline.find((t) => t.step === stepKey);

      return {
        id: (index + 1).toString(), // ID unik sederhana
        progress_id: progressId,
        nama_tahap: STEP_NAME_MAP[stepKey] || "Tahap Tidak Dikenali", // Gunakan Peta Nama
        status: mapUiStatusToProgressStatus(timelineData?.ui_status), // Gunakan Status dari API
        start_date: timelineData?.created_at || null, // Gunakan Tanggal dari API
        end_date: timelineData?.finalized_at || null, // Gunakan Tanggal dari API
        urutan: index + 1,
      };
    });
  }, [progressId, timeline]);

  const renderActiveStepForm = () => {
    if (activeStep === null) {
      return (
        <div className="bg-white rounded-2xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] p-8 h-full flex items-center justify-center">
          <div className="w-full max-w-xl text-center">
            {/* Icon Header */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Pilih Tahap Progress
              </h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Klik salah satu tahap dari timeline di sebelah kiri untuk
                melihat detail progress pengajuan
              </p>
            </div>

            {/* Decorative Element */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>6 Tahap tersedia untuk dipilih</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const mouStatus = steps.find((s) => s.nama_tahap === "MOU")?.status;
    const itStatus = steps.find(
      (s) => s.nama_tahap === "Ijin Tetangga"
    )?.status;
    const perizinanStatus = steps.find(
      (s) => s.nama_tahap === "Perizinan"
    )?.status;
    const notarisStatus = steps.find((s) => s.nama_tahap === "Notaris")?.status;
    const renovasiStatus = steps.find(
      (s) => s.nama_tahap === "Renovasi"
    )?.status;

    const step = steps[activeStep];
    const stepProgressId = step.progress_id; // gunakan progressId dari step

    if (step.status === "Batal") {
      // Logika untuk menampilkan data meski Batal
    }

    if (step.nama_tahap === "MOU") {
      return (
        <MouProgressCard
          progressId={stepProgressId}
          onDataUpdate={onDataUpdate}
        />
      );
    }
    if (step.nama_tahap === "Ijin Tetangga") {
      if (mouStatus === "Done") {
        return (
          <IzinTetanggaProgressCard
            progressId={stepProgressId}
            onDataUpdate={onDataUpdate}
          />
        );
      }
    }
    if (step.nama_tahap === "Perizinan") {
      if (mouStatus === "Done") {
        return (
          <PerizinanProgressCard
            progressId={stepProgressId}
            onDataUpdate={onDataUpdate}
          />
        );
      }
    }
    if (step.nama_tahap === "Notaris") {
      if (itStatus === "Done" && perizinanStatus === "Done") {
        return (
          <NotarisProgressCard
            progressId={stepProgressId}
            onDataUpdate={onDataUpdate}
          />
        );
      }
    }
    if (step.nama_tahap === "Renovasi") {
      if (notarisStatus === "Done") {
        return (
          <RenovasiProgressCard
            progressId={stepProgressId}
            onDataUpdate={onDataUpdate}
          />
        );
      }
    }
    if (step.nama_tahap === "Grand Opening") {
      if (renovasiStatus === "Done") {
        return (
          <GrandOpeningProgressCard
            progressId={stepProgressId}
            onDataUpdate={onDataUpdate}
          />
        );
      }
    }

    return (
      <div className="bg-white rounded-2xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] p-8 h-full flex items-center justify-center min-h-[400px]">
        <div className="w-full max-w-xl text-center">
          {/* Icon Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center shadow-md">
              <svg
                className="w-10 h-10 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Tahap Terkunci
            </h3>
            <p className="text-gray-600 text-base leading-relaxed mb-2">
              <span className="font-semibold text-gray-800">
                Tahap &quot;{step.nama_tahap}&quot;
              </span>{" "}
              belum dapat diakses
            </p>
            <p className="text-gray-500 text-base leading-relaxed">
              Selesaikan tahap sebelumnya terlebih dahulu untuk membuka akses
            </p>
          </div>

          {/* Decorative Element */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Selesaikan tahap berurutan untuk melanjutkan</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="back"
          className="text-sm lg:text-base self-start"
        >
          <ArrowLeft size={16} className="mr-2" />
          Kembali
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] transition-all duration-500">
        <div className="p-6">
          {/* Judul dan Created Date */}
          <div className="flex-1 min-w-0 mb-4">
            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
              {kplt.nama_kplt}
            </h1>
            <p className="text-base lg:text-lg text-gray-500 mt-1">
              {kplt.alamat}
            </p>
            {kplt.created_at && (
              <p className="flex items-center text-sm lg:text-base text-gray-500 mt-2">
                <CalendarIcon className="w-4 h-4 mr-1.5" />
                Dibuat pada: {formatDate(kplt.created_at)}
              </p>
            )}
          </div>
        </div>
        <div
          className={`transition-[max-height] duration-700 ease-in-out overflow-hidden ${
            isExpanded ? "max-h-[5000px]" : "max-h-0"
          }`}
        >
          <div className="px-6 pb-6">
            {/* Detail Info KPLT */}
            <div className="border-t border-gray-300 pt-5">
              <h4 className="text-base lg:text-lg font-semibold text-gray-700 mb-3">
                Informasi Detail KPLT
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                {/* Baris 1 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Provinsi<span className="text-red-500">*</span>
                  </label>
                  <p className="font-medium text-gray-900">{kplt.provinsi}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Kabupaten/Kota<span className="text-red-500">*</span>
                  </label>
                  <p className="font-medium text-gray-900">{kplt.kabupaten}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Kecamatan<span className="text-red-500">*</span>
                  </label>
                  <p className="font-medium text-gray-900">{kplt.kecamatan}</p>
                </div>

                {/* Baris 2 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Kelurahan/Desa<span className="text-red-500">*</span>
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.desa_kelurahan}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Alamat
                  </label>
                  <p className="font-medium text-gray-900">{kplt.alamat}</p>
                </div>

                {/* Baris 3 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    LatLong
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.latitude}, {kplt.longitude}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Nama Pemilik
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.nama_pemilik}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Kontak Pemilik
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.kontak_pemilik}
                  </p>
                </div>

                {/* Baris 4 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Harga Sewa
                  </label>
                  <p className="font-medium text-gray-900">{kplt.harga_sewa}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Alas Hak
                  </label>
                  <p className="font-medium text-gray-900">{kplt.alas_hak}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Bentuk Objek
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.bentuk_objek}
                  </p>
                </div>

                {/* Baris 5 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Format Store
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.format_store}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Luas
                  </label>
                  <p className="font-medium text-gray-900">{kplt.luas} m²</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Panjang
                  </label>
                  <p className="font-medium text-gray-900">{kplt.panjang} m</p>
                </div>

                {/* Baris 6 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Lebar Depan
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.lebar_depan} m
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Jumlah Lantai
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.jumlah_lantai}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Karakter Lokasi
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.karakter_lokasi}
                  </p>
                </div>

                {/* Baris 7 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Sosial Ekonomi
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.sosial_ekonomi}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Skor FPL
                  </label>
                  <p className="font-medium text-gray-900">{kplt.skor_fpl}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    APC
                  </label>
                  <p className="font-medium text-gray-900">{kplt.apc}</p>
                </div>

                {/* Baris 8 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    SPD
                  </label>
                  <p className="font-medium text-gray-900">{kplt.spd}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    STD
                  </label>
                  <p className="font-medium text-gray-900">{kplt.std}</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    Approval Intip
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.approval_intip}
                  </p>
                </div>

                {/* Baris 9 */}
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    KPLT Approval
                  </label>
                  <p className="font-medium text-gray-900">
                    {kplt.kplt_approval}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <label className="text-gray-500 text-xs block mb-1">
                    PE Status
                  </label>
                  <p className="font-medium text-gray-900">{kplt.pe_status}</p>
                </div>
              </div>
            </div>

            {/* Dokumen KPLT */}
            <div className="border-t border-gray-300 pt-5 mt-6">
              <h4 className="text-base lg:text-lg font-semibold text-gray-700 mb-3">
                Dokumen KPLT Terkait
              </h4>

              {isFilesError && (
                <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                  Gagal memuat dokumen.
                </p>
              )}

              {files && files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((file) => (
                    <div
                      key={file.href}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getFileIcon(file.fileType)}
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-semibold text-sm text-gray-800 truncate">
                            {generateLabel(file.field)}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {file.sizeFormatted} • {file.lastModifiedFormatted}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 flex-shrink-0"
                      >
                        <LinkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {files && files.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Tidak ada dokumen terkait untuk KPLT ini.
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 w-full text-gray-500 rounded-b-xl hover:bg-gray-50 focus-visible:bg-gray-100 transition-colors"
        >
          <ChevronDownIcon
            className={`w-6 h-6 mx-auto transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <div className="mt-8 lg:mt-10">
        {currentMainStatus === undefined ? (
          <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-gray-500" size={32} />
            <p className="mt-4 text-gray-600">Memuat status timeline...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KOLOM KIRI: Timeline Vertikal */}
            <div className="lg:col-span-1">
              {/* Tambahkan sticky top-24 agar sejajar & mengambang */}
              <div className="sticky top-12">
                <VerticalProgressTimeline
                  steps={steps}
                  activeStep={activeStep}
                  onStepClick={(index) =>
                    setActiveStep(activeStep === index ? null : index)
                  }
                />
              </div>
            </div>

            {/* KOLOM KANAN: Form Input Dinamis */}
            <div className="lg:col-span-2">
              <div className="">{renderActiveStepForm()}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
