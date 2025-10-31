"use client";

import React, { useState } from "react";
import { CheckCircle, Clock, MoreHorizontal } from "lucide-react";

export interface ProgressStep {
  id: string;
  progress_kplt_id: string;
  nama_tahap: string;
  status: "Done" | "In Progress" | "Pending";
  start_date: string | null;
  end_date: string | null;

  urutan: number;
}

interface TimelineProgressProps {
  steps: ProgressStep[];
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function TimelineProgressKplt({ steps }: TimelineProgressProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="w-full py-8 flex flex-col items-center">
      <h2 className="text-xl font-semibold text-gray-800 mb-8">
        Timeline Progress KPLT
      </h2>

      {/* Timeline Container */}
      <div className="relative w-full px-8 max-w-7xl">
        {/* Garis Background - Di bawah semua bulatan */}
        <div className="absolute top-7 left-0 right-0 flex items-center px-12">
          <div className="w-full h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Garis Progress - Overlay di atas garis background */}
        <div className="absolute top-7 left-0 right-0 flex items-center px-12 pointer-events-none">
          <div
            className="h-1 bg-green-500 rounded-full transition-all duration-500"
            style={{
              width: `${
                steps.findIndex((s) => s.status === "In Progress") >= 0
                  ? (steps.findIndex((s) => s.status === "In Progress") /
                      (steps.length - 1)) *
                    100
                  : steps.every((s) => s.status === "Done")
                  ? 100
                  : 0
              }%`,
            }}
          ></div>
        </div>

        {/* Timeline Steps */}
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
                onClick={() => setActiveStep(index)}
              >
                {/* Titik timeline */}
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

                {/* Nama tahap */}
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

      {/* Box Deskripsi */}
      {activeStep !== null && (
        <div className="mt-8 max-w-2xl w-full bg-white shadow-md rounded-2xl border border-gray-100 p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {steps[activeStep].nama_tahap}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            <strong>Status:</strong> {steps[activeStep].status}
          </p>
          <p className="text-sm text-gray-500">
            <strong>Mulai:</strong> {formatDate(steps[activeStep].start_date)} |{" "}
            <strong>Selesai:</strong> {formatDate(steps[activeStep].end_date)}
          </p>
        </div>
      )}
    </div>
  );
}
