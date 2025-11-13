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
import { ProgressStatusCard } from "@/components/ui/progress_kplt/ProgressStatusCard";
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
  izinTetanggaStatus?: string | null;
  timeline: TimelineItem[];
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

const LANGKAH_SEQUENTIAL = [
  "MOU",
  "Ijin Tetangga",
  "Perizinan",
  "Notaris",
  "Renovasi",
  "Grand Opening",
];
const STATUS_FINAL = "Grand Opening";

export default function DetailProgressKpltLayout({
  progressData,
  files,
  isFilesError,
  currentMainStatus,
  izinTetanggaStatus,
}: LayoutProps) {
  const router = useRouter();
  const { kplt } = progressData;
  const [isExpanded, setIsExpanded] = useState(false);

  const [activeStep, setActiveStep] = useState<number | null>(null); // Default step 1
  const progressId = progressData.id;

  const steps: ProgressStep[] = useMemo(() => {
    const getLangkahStatus = (namaLangkah: string): ProgressStep["status"] => {
      if (!currentMainStatus || currentMainStatus === "Not Started") {
        return "Pending";
      }
      if (currentMainStatus === STATUS_FINAL) return "Done";

      const currentIndex = LANGKAH_SEQUENTIAL.indexOf(currentMainStatus);
      const stepIndex = LANGKAH_SEQUENTIAL.indexOf(namaLangkah);

      if (currentIndex === -1 || stepIndex === -1) {
        if (namaLangkah === "MOU" && currentIndex === -1 && currentMainStatus) {
          return "In Progress";
        }
        if (currentMainStatus === STATUS_FINAL) return "Done";
        return "Pending";
      }

      if (stepIndex < currentIndex) return "Done";
      if (stepIndex === currentIndex) return "In Progress";
      return "Pending";
    };

    const getItStatus = (): ProgressStep["status"] => {
      if (izinTetanggaStatus === "Selesai") return "Done";
      if (izinTetanggaStatus === null || izinTetanggaStatus === undefined)
        return "Pending";
      return "In Progress";
    };

    const rawSteps: Omit<ProgressStep, "start_date" | "end_date">[] = [
      {
        id: "1",
        progress_id: progressId,
        nama_tahap: "MOU",
        status: getLangkahStatus("MOU"),
        urutan: 1,
      },
      {
        id: "2",
        progress_id: progressId,
        nama_tahap: "Ijin Tetangga",
        status: getItStatus(),
        urutan: 2,
      },
      {
        id: "3",
        progress_id: progressId,
        nama_tahap: "Perizinan",
        status: getLangkahStatus("Perizinan"),
        urutan: 3,
      },
      {
        id: "4",
        progress_id: progressId,
        nama_tahap: "Notaris",
        status: getLangkahStatus("Notaris"),
        urutan: 4,
      },
      {
        id: "5",
        progress_id: progressId,
        nama_tahap: "Renovasi",
        status: getLangkahStatus("Renovasi"),
        urutan: 5,
      },
      {
        id: "6",
        progress_id: progressId,
        nama_tahap: "Grand Opening",
        status: getLangkahStatus("Grand Opening"),
        urutan: 6,
      },
    ];
    return rawSteps.map((step) => ({
      ...step,
      start_date: null,
      end_date: null,
    }));
  }, [progressId, currentMainStatus, izinTetanggaStatus]);

  const renderActiveStepForm = () => {
    if (activeStep === null) {
      return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            Pilih salah satu tahap dari timeline di sebelah kiri.
          </p>
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
      return <MouProgressCard progressId={stepProgressId} />;
    }
    if (step.nama_tahap === "Ijin Tetangga") {
      if (mouStatus === "Done") {
        return <IzinTetanggaProgressCard progressId={stepProgressId} />;
      }
    }
    if (step.nama_tahap === "Perizinan") {
      if (mouStatus === "Done") {
        return <PerizinanProgressCard progressId={stepProgressId} />;
      }
    }
    if (step.nama_tahap === "Notaris") {
      if (itStatus === "Done" && perizinanStatus === "Done") {
        return <NotarisProgressCard progressId={stepProgressId} />;
      }
    }
    if (step.nama_tahap === "Renovasi") {
      if (notarisStatus === "Done") {
        return <RenovasiProgressCard progressId={stepProgressId} />;
      }
    }
    if (step.nama_tahap === "Grand Opening") {
      if (renovasiStatus === "Done") {
        return <GrandOpeningProgressCard progressId={stepProgressId} />;
      }
    }

    // Fallback jika belum 'unlocked'
    return (
      <ProgressStatusCard
        title={step.nama_tahap}
        status={step.status}
        startDate={step.start_date}
        endDate={step.end_date}
      />
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

              {/* Pesan error HANYA untuk file */}
              {isFilesError && (
                <p className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                  Gagal memuat dokumen.
                </p>
              )}

              {/* Grid dokumen */}
              {/* Kita tidak perlu 'isLoading' di sini karena sudah ditangani 'isCardLoading' */}
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

              {/* Tampilkan pesan jika tidak ada file */}
              {files && files.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Tidak ada dokumen terkait untuk KPLT ini.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tombol Toggle Expand/Collapse */}
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
          // Tampilkan loading jika status utama belum ada
          <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="animate-spin text-gray-500" size={32} />
            <p className="mt-4 text-gray-600">Memuat status timeline...</p>
          </div>
        ) : (
          // Tampilkan layout 2 kolom jika status sudah ada
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KOLOM KIRI: Timeline Vertikal */}
            <div className="lg:col-span-1">
              <div className="">
                <VerticalProgressTimeline
                  steps={steps}
                  activeStep={activeStep}
                  onStepClick={setActiveStep}
                />
              </div>
            </div>

            {/* KOLOM KANAN: Form Input Dinamis */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">{renderActiveStepForm()}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
