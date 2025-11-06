"use client";

import React, { useState } from "react";
import { CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import MouProgressCard from "@/components/ui/progress_kplt/MouProgressCard";
import IzinTetanggaProgressCard from "@/components/ui/progress_kplt/IzinTetanggaProgressCard";
import NotarisProgressCard from "./NotarisProgressCard";
import RenovasiProgressCard from "./RenovasiProgressCard";
import PerizinanProgressCard from "./PerizinanProgressCard";
import GrandOpeningProgressCard from "./GrandOpeningProgressCard";

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

// Fungsi generate urutan tetap (statis)
const generateStaticSteps = (progressId: string): ProgressStep[] => [
  {
    id: "1",
    progress_id: progressId,
    nama_tahap: "MOU",
    status: "Done",
    start_date: null,
    end_date: null,
    urutan: 1,
  },
  {
    id: "2",
    progress_id: progressId,
    nama_tahap: "Ijin Tetangga",
    status: "Done",
    start_date: null,
    end_date: null,
    urutan: 2,
  },
  {
    id: "3",
    progress_id: progressId,
    nama_tahap: "Perizinan",
    status: "In Progress",
    start_date: null,
    end_date: null,
    urutan: 3,
  },
  {
    id: "4",
    progress_id: progressId,
    nama_tahap: "Notaris",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 4,
  },
  {
    id: "5",
    progress_id: progressId,
    nama_tahap: "Renovasi",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 5,
  },
  {
    id: "6",
    progress_id: progressId,
    nama_tahap: "Building",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 6,
  },
  {
    id: "7",
    progress_id: progressId,
    nama_tahap: "Grand Opening",
    status: "Pending",
    start_date: null,
    end_date: null,
    urutan: 7,
  },
];

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
  const steps = generateStaticSteps(progressId);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleCloseCard = () => {
    setActiveStep(null);
  };

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
