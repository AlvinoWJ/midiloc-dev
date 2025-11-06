// components/ui/progress_kplt/timeline.tsx
"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, Clock, MoreHorizontal, Loader2 } from "lucide-react";

// Impor semua komponen Card
import MouProgressCard from "@/components/ui/progress_kplt/MouProgressCard";
import IzinTetanggaProgressCard from "@/components/ui/progress_kplt/IzinTetanggaProgressCard";
import NotarisProgressCard from "./NotarisProgressCard";
import PerizinanProgressCard from "./PerizinanProgressCard";
import RenovasiProgressCard from "./RenovasiProgressCard";
import GrandOpeningProgressCard from "./GrandOpeningProgressCard";

// Impor semua hook SWR untuk status
import { useMouProgress } from "@/hooks/progress_kplt/useMouProgress";
import { useIzinTetanggaProgress } from "@/hooks/progress_kplt/useIzinTetanggaProgress";
import { usePerizinanProgress } from "@/hooks/progress_kplt/usePerizinanProgreess"; // Sesuai nama file hook
import { useNotarisProgress } from "@/hooks/progress_kplt/useNotarisProgress";
import { useRenovasiProgress } from "@/hooks/progress_kplt/useRenovasiProgress";
import { useGrandOpeningProgress } from "@/hooks/progress_kplt/useGrandOpeningProgress";

export interface ProgressStep {
  id: string;
  progress_id: string;
  nama_tahap: string;
  status: "Done" | "In Progress" | "Pending";
  start_date: string | null;
  end_date: string | null;
  urutan: number;
}

interface TimelineProgressProps {
  progressId: string;
}

// --- FUNGSI generateStaticSteps DIHAPUS ---

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function TimelineProgressKplt({
  progressId,
}: TimelineProgressProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // 1. Ambil data dari semua hook
  const {
    data: mouData,
    loading: mouLoading,
    error: mouError,
  } = useMouProgress(progressId);
  const {
    data: itData,
    loading: itLoading,
    error: itError,
  } = useIzinTetanggaProgress(progressId);
  const {
    data: perizinanData,
    loading: perizinanLoading,
    error: perizinanError,
  } = usePerizinanProgress(progressId);
  const {
    data: notarisData,
    loading: notarisLoading,
    error: notarisError,
  } = useNotarisProgress(progressId);
  const {
    data: renovasiData,
    loading: renovasiLoading,
    error: renovasiError,
  } = useRenovasiProgress(progressId);
  const {
    data: goData,
    loading: goLoading,
    error: goError,
  } = useGrandOpeningProgress(progressId);

  const isLoading =
    mouLoading ||
    itLoading ||
    perizinanLoading ||
    notarisLoading ||
    renovasiLoading ||
    goLoading;
  const error =
    mouError ||
    itError ||
    perizinanError ||
    notarisError ||
    renovasiError ||
    goError;

  // 2. Helper untuk menentukan status dasar
  type BaseStatus = "Done" | "Pending";
  const getBaseStatus = (
    finalStatus: string | null | undefined
  ): BaseStatus => {
    if (finalStatus === "Selesai" || finalStatus === "Batal") {
      return "Done";
    }
    return "Pending";
  };

  // 3. Bangun array steps secara dinamis menggunakan useMemo
  const steps: ProgressStep[] = useMemo(() => {
    if (isLoading || error) return []; // Kembalikan array kosong jika loading atau error

    const rawSteps = [
      {
        name: "MOU",
        status: getBaseStatus(mouData?.final_status_mou),
        start: mouData?.created_at,
        end: mouData?.tgl_selesai_mou,
      },
      {
        name: "Ijin Tetangga",
        status: getBaseStatus(itData?.final_status_it),
        start: itData?.created_at,
        end: itData?.tgl_selesai_izintetangga,
      },
      {
        name: "Perizinan",
        status: getBaseStatus(perizinanData?.final_status_perizinan),
        start: perizinanData?.created_at,
        end: perizinanData?.tgl_selesai_perizinan,
      },
      {
        name: "Notaris",
        status: getBaseStatus(notarisData?.final_status_notaris),
        start: notarisData?.created_at,
        end: notarisData?.tgl_selesai_notaris,
      },
      {
        name: "Renovasi",
        status: getBaseStatus(renovasiData?.final_status_renov),
        start: renovasiData?.created_at,
        end: renovasiData?.tgl_selesai_renov,
      },
      {
        name: "Grand Opening",
        status: getBaseStatus(goData?.final_status_go),
        start: goData?.created_at,
        end: goData?.tgl_selesai_go,
      },
    ];

    let inProgressFound = false;

    return rawSteps.map((step, index): ProgressStep => {
      let finalStatus: ProgressStep["status"] = "Pending";

      if (step.status === "Done") {
        finalStatus = "Done";
      } else if (!inProgressFound) {
        finalStatus = "In Progress";
        inProgressFound = true;
      } else {
        finalStatus = "Pending";
      }

      return {
        id: (index + 1).toString(),
        progress_id: progressId,
        nama_tahap: step.name,
        status: finalStatus,
        start_date: step.start || null,
        end_date: step.end || null,
        urutan: index + 1,
      };
    });
  }, [
    progressId,
    isLoading,
    error,
    mouData,
    itData,
    perizinanData,
    notarisData,
    renovasiData,
    goData,
  ]);

  // 4. Handle Loading dan Error
  if (isLoading) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-gray-500" size={32} />
        <p className="mt-4 text-gray-600">Memuat status timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
        <p className="mt-4 text-red-600">
          Gagal memuat timeline: {error.toString()}
        </p>
      </div>
    );
  }

  const handleCloseCard = () => {
    setActiveStep(null);
  };

  // 5. Kalkulasi progressWidth menjadi dinamis
  const progressWidth =
    steps.findIndex((s) => s.status === "In Progress") >= 0
      ? (steps.findIndex((s) => s.status === "In Progress") /
          (steps.length - 1)) *
        100
      : steps.every((s) => s.status === "Done")
      ? 100
      : 0;

  return (
    <div className="w-full py-8 flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-8">
        Timeline Progress KPLT
      </h2>

      {/* Garis timeline */}
      <div className="relative w-full px-8 max-w-7xl">
        <div className="absolute top-7 left-0 right-0 flex items-center px-12">
          <div className="w-full h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div className="absolute top-7 left-0 right-0 flex items-center px-12 pointer-events-none">
          <div
            className="h-1 bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          ></div>
        </div>

        {/* Step icons */}
        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const isDone = step.status === "Done";
            const isInProgress = step.status === "In Progress";
            const iconColor = isDone
              ? "bg-green-500"
              : isInProgress
              ? "bg-yellow-500"
              : "bg-gray-300";

            return (
              <div
                key={step.id}
                className="flex flex-col items-center cursor-pointer flex-1"
                onClick={() =>
                  setActiveStep(activeStep === index ? null : index)
                }
              >
                <div
                  className={`flex items-center justify-center w-14 h-14 rounded-full shadow-md transition-all z-10 ${
                    activeStep === index
                      ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white scale-110"
                      : `${iconColor} text-white hover:scale-105`
                  }`}
                >
                  {isDone ? (
                    <CheckCircle size={22} />
                  ) : isInProgress ? (
                    <Clock size={22} />
                  ) : (
                    <MoreHorizontal size={22} />
                  )}
                </div>

                <span
                  className={`mt-3 text-base font-medium text-center max-w-[100px] leading-tight ${
                    activeStep === index
                      ? "text-gray-900 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {step.nama_tahap}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kartu deskripsi */}
      {activeStep !== null &&
        (() => {
          const step = steps[activeStep];
          if (step.nama_tahap === "MOU") {
            return <MouProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Ijin Tetangga") {
            return <IzinTetanggaProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Perizinan") {
            return <PerizinanProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Notaris") {
            return <NotarisProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Renovasi") {
            return <RenovasiProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Grand Opening") {
            return <GrandOpeningProgressCard progressId={step.progress_id} />;
          }
          // Fallback (seharusnya tidak terpakai)
          return (
            <div className="mt-8 max-w-2xl w-full bg-white shadow-md rounded-2xl border border-gray-100 p-6 text-center animate-in fade-in duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {step.nama_tahap}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Status:</strong> {step.status}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Mulai:</strong> {formatDate(step.start_date)} |{" "}
                <strong>Selesai:</strong> {formatDate(step.end_date)}
              </p>
            </div>
          );
        })()}
    </div>
  );
}
