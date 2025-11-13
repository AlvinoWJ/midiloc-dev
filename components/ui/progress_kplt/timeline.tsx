// "use client";

// import React, { useState, useMemo } from "react";
// import { CheckCircle, Clock, MoreHorizontal, Loader2 } from "lucide-react";
// import MouProgressCard from "./MouProgressCard";
// import IzinTetanggaProgressCard from "./IzinTetanggaProgressCard";
// import NotarisProgressCard from "./NotarisProgressCard";
// import PerizinanProgressCard from "./PerizinanProgressCard";
// import RenovasiProgressCard from "./RenovasiProgressCard";
// import GrandOpeningProgressCard from "./GrandOpeningProgressCard";
// import { ProgressStatusCard } from "./ProgressStatusCard";

// export interface ProgressStep {
//   id: string;
//   progress_id: string;
//   nama_tahap: string;
//   status: "Done" | "In Progress" | "Pending" | "Batal";
//   start_date: string | null;
//   end_date: string | null;
//   urutan: number;
// }

// interface TimelineProgressProps {
//   progressId: string;
//   progressStatus?: string;
//   izinTetanggaStatus?: string | null; // final_it_status
// }

// const LANGKAH_SEQUENTIAL = [
//   "MOU",
//   "Perizinan",
//   "Notaris",
//   "Renovasi",
//   "Grand Opening",
// ];
// const STATUS_FINAL = "Grand Opening";

// // =======================================================================
// // PERUBAHAN: Komponen Helper untuk Ikon Step
// // =======================================================================
// interface StepIconProps {
//   step: ProgressStep;
//   isActive: boolean;
//   onClick: () => void;
// }

// function StepIcon({ step, isActive, onClick }: StepIconProps) {
//   const isDone = step.status === "Done";
//   const isInProgress = step.status === "In Progress";
//   const iconColor = isDone
//     ? "bg-green-500"
//     : isInProgress
//     ? "bg-yellow-500"
//     : "bg-gray-300";

//   return (
//     <div
//       className="flex flex-col items-center cursor-pointer z-10 w-[120px] shrink-0"
//       onClick={onClick}
//     >
//       <div
//         className={`flex items-center justify-center w-14 h-14 rounded-full shadow-md transition-all ${
//           isActive
//             ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white scale-110"
//             : `${iconColor} text-white hover:scale-105`
//         }`}
//       >
//         {isDone ? (
//           <CheckCircle size={22} />
//         ) : isInProgress ? (
//           <Clock size={22} />
//         ) : (
//           <MoreHorizontal size={22} />
//         )}
//       </div>
//       <span
//         className={`mt-3 text-base font-medium text-center max-w-[100px] leading-tight ${
//           isActive ? "text-gray-900 font-semibold" : "text-gray-500"
//         }`}
//       >
//         {step.nama_tahap}
//       </span>
//     </div>
//   );
// }

// // =======================================================================
// // PERUBAHAN: Komponen Helper untuk Garis Konektor
// // =======================================================================
// function TimelineConnector() {
//   return <div className="w-full h-1 bg-gray-300 rounded-full mt-[27px]"></div>;
// }

// // =======================================================================
// // Komponen Utama
// // =======================================================================
// export default function TimelineProgressKplt({
//   progressId,
//   progressStatus,
//   izinTetanggaStatus,
// }: TimelineProgressProps) {
//   // PERUBAHAN: Menggunakan string (nama_tahap) untuk activeStep
//   const [activeStep, setActiveStep] = useState<string | null>(null);

//   const steps: ProgressStep[] = useMemo(() => {
//     const getLangkahStatus = (namaLangkah: string): ProgressStep["status"] => {
//       if (!progressStatus || progressStatus === "Not Started") {
//         return "Pending";
//       }
//       if (progressStatus === STATUS_FINAL) return "Done";

//       const currentIndex = LANGKAH_SEQUENTIAL.indexOf(progressStatus);
//       const stepIndex = LANGKAH_SEQUENTIAL.indexOf(namaLangkah);

//       if (currentIndex === -1 || stepIndex === -1) {
//         if (namaLangkah === "MOU" && currentIndex === -1 && progressStatus) {
//           return "In Progress";
//         }
//         if (progressStatus === STATUS_FINAL) return "Done";
//         return "Pending";
//       }

//       if (stepIndex < currentIndex) return "Done";
//       if (stepIndex === currentIndex) return "In Progress";
//       return "Pending";
//     };

//     const getItStatus = (): ProgressStep["status"] => {
//       if (izinTetanggaStatus === "Selesai") return "Done";
//       if (izinTetanggaStatus === "Belum Selesai") return "In Progress";
//       return "Pending"; // default
//     };

//     // PERUBAHAN: Logika ini kembali seperti ASLI (6 steps)
//     const rawSteps: Omit<ProgressStep, "start_date" | "end_date">[] = [
//       {
//         id: "1",
//         progress_id: progressId,
//         nama_tahap: "MOU",
//         status: getLangkahStatus("MOU"),
//         urutan: 1,
//       },
//       {
//         id: "2",
//         progress_id: progressId,
//         nama_tahap: "Ijin Tetangga",
//         status: getItStatus(),
//         urutan: 2,
//       },
//       {
//         id: "3",
//         progress_id: progressId,
//         nama_tahap: "Perizinan",
//         status: getLangkahStatus("Perizinan"),
//         urutan: 3,
//       },
//       {
//         id: "4",
//         progress_id: progressId,
//         nama_tahap: "Notaris",
//         status: getLangkahStatus("Notaris"),
//         urutan: 4,
//       },
//       {
//         id: "5",
//         progress_id: progressId,
//         nama_tahap: "Renovasi",
//         status: getLangkahStatus("Renovasi"),
//         urutan: 5,
//       },
//       {
//         id: "6",
//         progress_id: progressId,
//         nama_tahap: "Grand Opening",
//         status: getLangkahStatus("Grand Opening"),
//         urutan: 6,
//       },
//     ];

//     return rawSteps.map((step) => ({
//       ...step,
//       start_date: null,
//       end_date: null,
//     }));
//   }, [progressId, progressStatus, izinTetanggaStatus]);

//   // PERUBAHAN: Ambil setiap step object untuk di-render manual
//   const mouStep = steps.find((s) => s.nama_tahap === "MOU");
//   const itStep = steps.find((s) => s.nama_tahap === "Ijin Tetangga");
//   const perizinanStep = steps.find((s) => s.nama_tahap === "Perizinan");
//   const notarisStep = steps.find((s) => s.nama_tahap === "Notaris");
//   const renovasiStep = steps.find((s) => s.nama_tahap === "Renovasi");
//   const goStep = steps.find((s) => s.nama_tahap === "Grand Opening");

//   if (progressStatus === undefined || !mouStep) {
//     return (
//       <div className="w-full py-8 flex flex-col items-center justify-center min-h-[300px]">
//         <Loader2 className="animate-spin text-gray-500" size={32} />
//         <p className="mt-4 text-gray-600">Memuat status timeline...</p>
//       </div>
//     );
//   }

//   const handleStepClick = (namaTahap: string) => {
//     setActiveStep(activeStep === namaTahap ? null : namaTahap);
//   };

//   return (
//     <div className="w-full py-8 flex flex-col items-center">
//       <div className=" w-full bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-2xl border border-gray-100 p-6 text-center animate-in fade-in duration-300">
//         <h2 className="text-xl font-semibold text-gray-800 mb-8">
//           Timeline Progress KPLT
//         </h2>

//         {/* =================================================================== */}
//         {/* PERUBAHAN BESAR: Tata Letak Timeline Baru */}
//         {/* =================================================================== */}
//         <div className="relative w-full px-8 max-w-7xl overflow-x-auto py-4">
//           <div className="relative flex justify-between items-start min-w-[700px]">
//             {/* 1. Step MOU */}
//             <StepIcon
//               step={mouStep}
//               isActive={activeStep === mouStep.nama_tahap}
//               onClick={() => handleStepClick(mouStep.nama_tahap)}
//             />
//             <TimelineConnector />

//             {/* 2. Blok Paralel (Fork) */}
//             <div className="flex flex-col items-center justify-center gap-4 py-4 z-10 w-[120px] shrink-0 -mt-4">
//               {/* Garis penghubung fork (opsional, ini visual) */}
//               {/* ... */}
//               {itStep && (
//                 <StepIcon
//                   step={itStep}
//                   isActive={activeStep === itStep.nama_tahap}
//                   onClick={() => handleStepClick(itStep.nama_tahap)}
//                 />
//               )}
//               {perizinanStep && (
//                 <StepIcon
//                   step={perizinanStep}
//                   isActive={activeStep === perizinanStep.nama_tahap}
//                   onClick={() => handleStepClick(perizinanStep.nama_tahap)}
//                 />
//               )}
//             </div>
//             <TimelineConnector />

//             {/* 3. Step Notaris */}
//             {notarisStep && (
//               <StepIcon
//                 step={notarisStep}
//                 isActive={activeStep === notarisStep.nama_tahap}
//                 onClick={() => handleStepClick(notarisStep.nama_tahap)}
//               />
//             )}
//             <TimelineConnector />

//             {/* 4. Step Renovasi */}
//             {renovasiStep && (
//               <StepIcon
//                 step={renovasiStep}
//                 isActive={activeStep === renovasiStep.nama_tahap}
//                 onClick={() => handleStepClick(renovasiStep.nama_tahap)}
//               />
//             )}
//             <TimelineConnector />

//             {/* 5. Step Grand Opening */}
//             {goStep && (
//               <StepIcon
//                 step={goStep}
//                 isActive={activeStep === goStep.nama_tahap}
//                 onClick={() => handleStepClick(goStep.nama_tahap)}
//               />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Kartu deskripsi */}
//       {/* PERUBAHAN: Logika ini sekarang memeriksa string nama_tahap */}
//       {activeStep !== null &&
//         (() => {
//           if (activeStep === "MOU") {
//             return <MouProgressCard progressId={progressId} />;
//           }
//           if (activeStep === "Ijin Tetangga") {
//             return <IzinTetanggaProgressCard progressId={progressId} />;
//           }
//           if (activeStep === "Perizinan") {
//             return <PerizinanProgressCard progressId={progressId} />;
//           }
//           if (activeStep === "Notaris") {
//             return <NotarisProgressCard progressId={progressId} />;
//           }
//           if (activeStep === "Renovasi") {
//             return <RenovasiProgressCard progressId={progressId} />;
//           }
//           if (activeStep === "Grand Opening") {
//             return <GrandOpeningProgressCard progressId={progressId} />;
//           }

//           // Fallback, seharusnya tidak terjadi
//           const step = steps.find((s) => s.nama_tahap === activeStep);
//           return step ? (
//             <ProgressStatusCard
//               title={step.nama_tahap}
//               status={step.status}
//               startDate={step.start_date}
//               endDate={step.end_date}
//             />
//           ) : null;
//         })()}
//     </div>
//   );
// }
