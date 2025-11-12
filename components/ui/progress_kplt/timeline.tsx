"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle, Clock, MoreHorizontal, Loader2 } from "lucide-react";
import MouProgressCard from "./MouProgressCard";
import IzinTetanggaProgressCard from "./IzinTetanggaProgressCard";
import NotarisProgressCard from "./NotarisProgressCard";
import PerizinanProgressCard from "./PerizinanProgressCard";
import RenovasiProgressCard from "./RenovasiProgressCard";
import GrandOpeningProgressCard from "./GrandOpeningProgressCard";
// HAPUS SEMUA IMPORT use...Progress (MOU, IT, Perizinan, Notaris, Renovasi, GO)
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
  progressId: string; // Tetap diperlukan untuk kartu
  progressStatus?: string; // BARU: Dari progress.status, cth: "Notaris"
  izinTetanggaStatus?: string | null; // BARU: Dari final_status_it
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const LANGKAH_SEQUENTIAL = [
  "MOU",
  "Perizinan",
  "Notaris",
  "Renovasi",
  "Grand Opening",
];
const STATUS_FINAL = "Grand Opening";

export default function TimelineProgressKplt({
  progressId,
  progressStatus,
  izinTetanggaStatus,
}: TimelineProgressProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps: ProgressStep[] = useMemo(() => {
    const getLangkahStatus = (namaLangkah: string): ProgressStep["status"] => {
      if (!progressStatus || progressStatus === "Not Started") {
        return "Pending";
      }
      if (progressStatus === STATUS_FINAL) return "Done";

      const currentIndex = LANGKAH_SEQUENTIAL.indexOf(progressStatus);
      const stepIndex = LANGKAH_SEQUENTIAL.indexOf(namaLangkah);

      if (currentIndex === -1 || stepIndex === -1) {
        if (namaLangkah === "MOU" && currentIndex === -1 && progressStatus) {
          return "In Progress";
        }
        if (progressStatus === STATUS_FINAL) return "Done";
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
      // Status lain (cth: "Belum Selesai") berarti In Progress
      return "In Progress";
    };

    // 3. Dapatkan status untuk setiap langkah
    const mouStatus = getLangkahStatus("MOU");
    const itStatus = getItStatus();
    const perizinanStatus = getLangkahStatus("Perizinan");
    const notarisStatus = getLangkahStatus("Notaris");
    const renovasiStatus = getLangkahStatus("Renovasi");
    const goStatus = getLangkahStatus("Grand Opening");

    // 4. Bangun array steps (sesuai urutan di file lama Anda)
    const rawSteps: Omit<ProgressStep, "start_date" | "end_date">[] = [
      {
        id: "1",
        progress_id: progressId,
        nama_tahap: "MOU",
        status: mouStatus,
        urutan: 1,
      },
      {
        id: "2",
        progress_id: progressId,
        nama_tahap: "Ijin Tetangga",
        status: itStatus,
        urutan: 2,
      },
      {
        id: "3",
        progress_id: progressId,
        nama_tahap: "Perizinan",
        status: perizinanStatus,
        urutan: 3,
      },
      {
        id: "4",
        progress_id: progressId,
        nama_tahap: "Notaris",
        status: notarisStatus,
        urutan: 4,
      },
      {
        id: "5",
        progress_id: progressId,
        nama_tahap: "Renovasi",
        status: renovasiStatus,
        urutan: 5,
      },
      {
        id: "6",
        progress_id: progressId,
        nama_tahap: "Grand Opening",
        status: goStatus,
        urutan: 6,
      },
    ];
    return rawSteps.map((step) => ({
      ...step,
      start_date: null,
      end_date: null,
    }));
  }, [progressId, progressStatus, izinTetanggaStatus]);

  if (progressStatus === undefined) {
    return (
      <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-gray-500" size={32} />
        <p className="mt-4 text-gray-600">Memuat status timeline...</p>
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
