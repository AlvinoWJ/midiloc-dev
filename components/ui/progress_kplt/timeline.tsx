// components/ui/progress_kplt/timeline.tsx
"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import MouProgressCard from "./MouProgressCard";
import IzinTetanggaProgressCard from "./IzinTetanggaProgressCard";
import NotarisProgressCard from "./NotarisProgressCard";
import PerizinanProgressCard from "./PerizinanProgressCard";
import RenovasiProgressCard from "./RenovasiProgressCard";
import GrandOpeningProgressCard from "./GrandOpeningProgressCard";
import { useMouProgress } from "@/hooks/progress_kplt/useMouProgress";
import { useIzinTetanggaProgress } from "@/hooks/progress_kplt/useIzinTetanggaProgress";
import { usePerizinanProgress } from "@/hooks/progress_kplt/usePerizinanProgreess";
import { useNotarisProgress } from "@/hooks/progress_kplt/useNotarisProgress";
import { useRenovasiProgress } from "@/hooks/progress_kplt/useRenovasiProgress";
import { useGrandOpeningProgress } from "@/hooks/progress_kplt/useGrandOpeningProgress";
import { ProgressStatusCard } from "./ProgressStatusCard";

export interface ProgressStep {
  id: string;
  progress_id: string;
  nama_tahap: string;
  status: "Done" | "In Progress" | "Pending" | "Batal";
  start_date: string | null;
  end_date: string | null;
  urutan: number;
}

interface TimelineProgressProps {
  progressId: string;
}

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
  type BaseStatus = "Done" | "Pending" | "Batal";
  const getBaseStatus = (
    finalStatus: string | null | undefined
  ): BaseStatus => {
    if (finalStatus === "Selesai") {
      return "Done";
    }
    if (finalStatus === "Batal") {
      return "Batal";
    }
    return "Pending";
  };

  const steps: ProgressStep[] = useMemo(() => {
    if (isLoading || error) return []; // Kembalikan array kosong jika loading atau error

    const mouBaseStatus = getBaseStatus(mouData?.final_status_mou);
    const itBaseStatus = getBaseStatus(itData?.final_status_it);
    const perizinanBaseStatus = getBaseStatus(
      perizinanData?.final_status_perizinan
    );
    const notarisBaseStatus = getBaseStatus(notarisData?.final_status_notaris);
    const renovasiBaseStatus = getBaseStatus(renovasiData?.final_status_renov);
    const goBaseStatus = getBaseStatus(goData?.final_status_go);

    // 2. Tentukan status final (Done/In Progress/Pending/Batal) berdasarkan logika dependensi
    let mouStatus: ProgressStep["status"];
    if (!mouData) {
      // Jika data belum ada (null/undefined) setelah loading selesai, statusnya Pending
      mouStatus = "Pending";
    } else if (mouBaseStatus === "Done") {
      mouStatus = "Done";
    } else if (mouBaseStatus === "Batal") {
      mouStatus = "Batal";
    } else {
      // Jika mouData ada, tapi statusnya bukan Done atau Batal, berarti In Progress
      mouStatus = "In Progress";
    }

    let itStatus: ProgressStep["status"];
    if (mouStatus !== "Done") {
      itStatus = "Pending"; // Prasyarat (MOU) belum selesai
    } else {
      // Prasyarat terpenuhi, cek data IT
      if (!itData) {
        itStatus = "Pending"; // MOU Done, tapi data IT belum ada
      } else if (itBaseStatus === "Done") {
        itStatus = "Done";
      } else if (itBaseStatus === "Batal") {
        itStatus = "Batal";
      } else {
        itStatus = "In Progress"; // MOU Done, data IT ada, belum Done/Batal
      }
    }

    let perizinanStatus: ProgressStep["status"];
    if (mouStatus !== "Done") {
      perizinanStatus = "Pending"; // Prasyarat (MOU) belum selesai
    } else {
      // Prasyarat terpenuhi, cek data Perizinan
      if (!perizinanData) {
        perizinanStatus = "Pending"; // MOU Done, tapi data Perizinan belum ada
      } else if (perizinanBaseStatus === "Done") {
        perizinanStatus = "Done";
      } else if (perizinanBaseStatus === "Batal") {
        perizinanStatus = "Batal";
      } else {
        perizinanStatus = "In Progress"; // MOU Done, data Perizinan ada
      }
    }

    let notarisStatus: ProgressStep["status"];
    if (itStatus !== "Done" || perizinanStatus !== "Done") {
      notarisStatus = "Pending"; // Prasyarat (IT & Perizinan) belum selesai
    } else {
      // Prasyarat terpenuhi, cek data Notaris
      if (!notarisData) {
        notarisStatus = "Pending"; // IT/Perizinan Done, tapi data Notaris belum ada
      } else if (notarisBaseStatus === "Done") {
        notarisStatus = "Done";
      } else if (notarisBaseStatus === "Batal") {
        notarisStatus = "Batal";
      } else {
        notarisStatus = "In Progress"; // IT/Perizinan Done, data Notaris ada
      }
    }

    let renovasiStatus: ProgressStep["status"];
    if (notarisStatus !== "Done") {
      renovasiStatus = "Pending"; // Prasyarat (Notaris) belum selesai
    } else {
      // Prasyarat terpenuhi, cek data Renovasi
      if (!renovasiData) {
        renovasiStatus = "Pending";
      } else if (renovasiBaseStatus === "Done") {
        renovasiStatus = "Done";
      } else if (renovasiBaseStatus === "Batal") {
        renovasiStatus = "Batal";
      } else {
        renovasiStatus = "In Progress";
      }
    }

    let goStatus: ProgressStep["status"];
    if (renovasiStatus !== "Done") {
      goStatus = "Pending"; // Prasyarat (Renovasi) belum selesai
    } else {
      // Prasyarat terpenuhi, cek data GO
      if (!goData) {
        goStatus = "Pending";
      } else if (goBaseStatus === "Done") {
        goStatus = "Done";
      } else if (goBaseStatus === "Batal") {
        goStatus = "Batal";
      } else {
        goStatus = "In Progress";
      }
    }

    const rawSteps: ProgressStep[] = [
      {
        id: "1",
        progress_id: progressId,
        nama_tahap: "MOU",
        status: mouStatus,
        start_date: mouData?.created_at || null,
        end_date: mouData?.tgl_selesai_mou || null,
        urutan: 1,
      },
      {
        id: "2",
        progress_id: progressId,
        nama_tahap: "Ijin Tetangga",
        status: itStatus,
        start_date: itData?.created_at || null,
        end_date: itData?.tgl_selesai_izintetangga || null,
        urutan: 2,
      },
      {
        id: "3",
        progress_id: progressId,
        nama_tahap: "Perizinan",
        status: perizinanStatus,
        start_date: perizinanData?.created_at || null,
        end_date: perizinanData?.tgl_selesai_perizinan || null,
        urutan: 3,
      },
      {
        id: "4",
        progress_id: progressId,
        nama_tahap: "Notaris",
        status: notarisStatus,
        start_date: notarisData?.created_at || null,
        end_date: notarisData?.tgl_selesai_notaris || null,
        urutan: 4,
      },
      {
        id: "5",
        progress_id: progressId,
        nama_tahap: "Renovasi",
        status: renovasiStatus,
        start_date: renovasiData?.created_at || null,
        end_date: renovasiData?.tgl_selesai_renov || null,
        urutan: 5,
      },
      {
        id: "6",
        progress_id: progressId,
        nama_tahap: "Grand Opening",
        status: goStatus,
        start_date: goData?.created_at || null,
        end_date: goData?.tgl_selesai_go || null,
        urutan: 6,
      },
    ];

    return rawSteps;
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

  return (
    <div className="w-full py-8 flex flex-col items-center">
      <div className=" w-full bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-2xl border border-gray-100 p-6 text-center animate-in fade-in duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-8">
          Timeline Progress KPLT
        </h2>

        {/* Garis timeline */}
        <div className="relative w-full px-8 max-w-7xl">
          {/* Garis abu-abu (dipertahankan) */}
          <div className="absolute top-7 left-0 right-0 flex items-center px-12">
            <div className="w-full h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Step icons */}
          <div className="relative flex justify-between items-start">
            {steps.map((step, index) => {
              const isDone = step.status === "Done";
              const isInProgress = step.status === "In Progress";
              const isPending = step.status === "Pending";
              const iconColor = isDone
                ? "bg-green-500"
                : isInProgress
                ? "bg-yellow-500"
                : "bg-gray-300";

              // Tentukan apakah step ini sedang aktif
              const isActive = activeStep === index;

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
                      isActive
                        ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white scale-110"
                        : `${iconColor} text-white hover:scale-105`
                    } ${
                      isDone
                        ? isActive
                          ? "ring-4 ring-purple-400 ring-offset-4"
                          : "ring-4 ring-green-500 ring-offset-4"
                        : isInProgress
                        ? isActive
                          ? "ring-4 ring-purple-400 ring-offset-4"
                          : "ring-4 ring-yellow-500 ring-offset-4"
                        : isPending
                        ? isActive
                          ? "ring-4 ring-purple-400 ring-offset-4"
                          : "ring-4 ring-gray-300 ring-offset-4"
                        : ""
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
                      isActive ? "text-gray-900 font-semibold" : "text-gray-500"
                    }`}
                  >
                    {step.nama_tahap}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kartu deskripsi */}
      {activeStep !== null &&
        (() => {
          const mouStatus = steps.find((s) => s.nama_tahap === "MOU")?.status;
          const itStatus = steps.find(
            (s) => s.nama_tahap === "Ijin Tetangga"
          )?.status;
          const perizinanStatus = steps.find(
            (s) => s.nama_tahap === "Perizinan"
          )?.status;
          const notarisStatus = steps.find(
            (s) => s.nama_tahap === "Notaris"
          )?.status;
          const renovasiStatus = steps.find(
            (s) => s.nama_tahap === "Renovasi"
          )?.status;

          const step = steps[activeStep];

          // Logika untuk status Batal
          if (step.status === "Batal") {
            // Jika Batal, tetap tampilkan kartunya agar user bisa lihat data/alasan
            if (step.nama_tahap === "MOU")
              return <MouProgressCard progressId={step.progress_id} />;
            if (step.nama_tahap === "Ijin Tetangga")
              return <IzinTetanggaProgressCard progressId={step.progress_id} />;
            if (step.nama_tahap === "Perizinan")
              return <PerizinanProgressCard progressId={step.progress_id} />;
            if (step.nama_tahap === "Notaris")
              return <NotarisProgressCard progressId={step.progress_id} />;
            if (step.nama_tahap === "Renovasi")
              return <RenovasiProgressCard progressId={step.progress_id} />;
            if (step.nama_tahap === "Grand Opening")
              return <GrandOpeningProgressCard progressId={step.progress_id} />;
          }

          if (step.nama_tahap === "MOU") {
            return <MouProgressCard progressId={step.progress_id} />;
          }
          if (step.nama_tahap === "Ijin Tetangga") {
            if (mouStatus === "Done") {
              return <IzinTetanggaProgressCard progressId={step.progress_id} />;
            }
          }
          if (step.nama_tahap === "Perizinan") {
            // HANYA TAMPIL jika mouStatus sudah "Done"
            if (mouStatus === "Done") {
              return <PerizinanProgressCard progressId={step.progress_id} />;
            }
          }

          if (step.nama_tahap === "Notaris") {
            // HANYA TAMPIL jika IT dan Perizinan sudah "Done"
            if (itStatus === "Done" && perizinanStatus === "Done") {
              return <NotarisProgressCard progressId={step.progress_id} />;
            }
          }

          if (step.nama_tahap === "Renovasi") {
            // HANYA TAMPIL jika Notaris sudah "Done"
            if (notarisStatus === "Done") {
              return <RenovasiProgressCard progressId={step.progress_id} />;
            }
          }

          if (step.nama_tahap === "Grand Opening") {
            // HANYA TAMPIL jika Renovasi sudah "Done"
            if (renovasiStatus === "Done") {
              return <GrandOpeningProgressCard progressId={step.progress_id} />;
            }
          }
          return (
            <ProgressStatusCard
              title={step.nama_tahap}
              status={step.status}
              startDate={step.start_date}
              endDate={step.end_date}
            />
          );
        })()}
    </div>
  );
}
