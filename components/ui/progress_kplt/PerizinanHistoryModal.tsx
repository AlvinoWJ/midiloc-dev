"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  History,
  Loader2,
  FileText,
  LinkIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePerizinanHistory,
  PerizinanHistoryItem,
} from "@/hooks/progress_kplt/usePerizinanHistory";

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "-";
  }
};

const formatDateOnly = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

function getChanges(
  current: PerizinanHistoryItem["data"],
  previous: PerizinanHistoryItem["data"] | null
): string[] {
  if (!previous) {
    return ["Mencatat data awal."];
  }

  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);

  const fieldLabels: Record<string, string> = {
    tgl_oss: "Tgl OSS",
    oss: "OSS",
    tgl_sph: "Tgl SPH",
    nominal_sph: "Nominal SPH",
    tgl_st_berkas: "Tgl ST Berkas",
    status_berkas: "Status Berkas",
    tgl_gambar_denah: "Tgl Denah",
    status_gambar_denah: "status Gambar Denah",
    tgl_spk: "Tgl SPK",
    status_spk: "Status SPK",
    tgl_rekom_notaris: "Tgl Rekom Notaris",
    rekom_notaris_vendor: "Rekom Notaris",
    file_sph: "File SPH",
    file_bukti_st: "File Bukti ST",
    file_denah: "File Denah",
    file_spk: "File SPK",
    file_rekom_notaris: "File Rekom Notaris",
  };

  allKeys.forEach((key) => {
    if (
      key.startsWith("final_status") ||
      key.startsWith("tgl_selesai") ||
      key === "user_nama" ||
      key === "notes"
    ) {
      return;
    }

    const currentVal = current[key];
    const previousVal = previous[key];

    if (currentVal !== previousVal) {
      const label = fieldLabels[key] || key;
      if (!previousVal) {
        changes.push(`Menambahkan ${label}`);
      } else {
        changes.push(`Mengubah ${label}`);
      }
    }
  });

  return changes.length > 0 ? changes : ["Pembaruan Status."];
}

interface HistoryItemProps {
  item: PerizinanHistoryItem;
  previousItem: PerizinanHistoryItem | null;
  onSelect: () => void;
}

// Komponen kecil untuk menampilkan satu item riwayat
const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  previousItem,
  onSelect,
}) => {
  const currentStatus = item.data?.final_status_perizinan;
  const prevStatus = previousItem?.data?.final_status_perizinan;
  const dataChanges = getChanges(item.data, previousItem?.data || null);

  let statusChangeElement: React.ReactNode = null;
  if (currentStatus !== prevStatus) {
    statusChangeElement = (
      <p className="text-sm text-gray-700">
        Status Perizinan{" "}
        <span className="font-medium text-green-600">{currentStatus}</span>
      </p>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="relative w-full text-left pl-8 py-4 border-l border-gray-300 hover:bg-gray-50 transition-colors duration-150"
    >
      <span className="absolute -left-[9px] top-6 w-4 h-4 bg-red-500 rounded-full border-4 border-white"></span>
      <p className="text-sm font-semibold text-gray-800 mb-1">
        {formatDate(item.created_at)}
      </p>
      <div className="text-sm text-gray-600">
        {dataChanges.map((change, idx) => (
          <p key={idx}>• {change}</p>
        ))}
      </div>
      {statusChangeElement && (
        <div className="mt-2 pt-2 border-t border-dashed">
          {statusChangeElement}
        </div>
      )}
    </button>
  );
};

const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <h3 className="font-semibold text-gray-600 text-sm mb-1">{label}</h3>
    <div className="bg-gray-100 px-4 py-2 rounded-md text-base text-gray-900 min-h-[38px]">
      {value || "-"}
    </div>
  </div>
);

// Komponen read-only untuk file
const FileLink: React.FC<{
  label: string;
  fileKey: string | null | undefined;
  progressId: string;
}> = ({ label, fileKey, progressId }) => {
  const href = fileKey
    ? `/api/files/perizinan/${progressId}?path=${encodeURIComponent(
        fileKey
      )}&download=0`
    : null;

  if (!href) {
    return (
      <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
        <span className="text-sm text-gray-400 italic">{label} (Kosong)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <span
        className="text-sm text-gray-700 font-medium truncate pr-4"
        title={fileKey || ""}
      >
        {label}
      </span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex-shrink-0"
      >
        <LinkIcon className="w-3 h-3 mr-1.5" />
        Lihat
      </a>
    </div>
  );
};

const HistoryDetailView: React.FC<{
  item: PerizinanHistoryItem;
  progressId: string;
  onBack: () => void;
}> = ({ item, progressId, onBack }) => {
  const data = item.data || {};

  return (
    <>
      <div className="relative border-b border-gray-300 bg-gradient-to-r from-red-50 via-white to-red-50 px-6 py-5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span>Detail Riwayat</span>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack} // Tombol kembali
          className="rounded-full z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">Snapshot data pada:</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatDate(item.created_at)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField
            label="Tanggal OSS"
            value={formatDateOnly(data.tgl_oss)}
          />
          <DetailField label="OSS" value={data.oss} />
          <DetailField
            label="Tanggal SPH"
            value={formatDateOnly(data.tgl_sph)}
          />
          <DetailField
            label="Tanggal ST"
            value={formatDateOnly(data.tgl_st_berkas)}
          />
          <DetailField
            label="Tanggal Denah"
            value={formatDateOnly(data.tgl_gambar_denah)}
          />
          <DetailField
            label="Tanggal SPK"
            value={formatDateOnly(data.tgl_spk)}
          />
          <DetailField
            label="Tanggal Rekom Notaris"
            value={formatDateOnly(data.tgl_rekom_notaris)}
          />
          <DetailField
            label="Nominal SPH (Rp)"
            value={data.nominal_sph?.toLocaleString("id-ID") || "-"}
          />
          <DetailField
            label="Status Final"
            value={data.final_status_perizinan}
          />
          <DetailField
            label="Tanggal Selesai"
            value={formatDateOnly(data.tgl_selesai_perizinan)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-600 text-sm mb-2">Dokumen</h3>
          <FileLink
            label="File SPH"
            fileKey={data.file_sph}
            progressId={progressId}
          />
          <FileLink
            label="File Bukti ST"
            fileKey={data.file_bukti_st}
            progressId={progressId}
          />
          <FileLink
            label="File Denah"
            fileKey={data.file_denah}
            progressId={progressId}
          />
          <FileLink
            label="File SPK"
            fileKey={data.file_spk}
            progressId={progressId}
          />
          <FileLink
            label="File Rekom Notaris"
            fileKey={data.file_rekom_notaris}
            progressId={progressId}
          />
        </div>
      </div>
    </>
  );
};

interface HistoryModalProps {
  progressId: string;
  onClose: () => void;
}

export function PerizinanHistoryModal({
  progressId,
  onClose,
}: HistoryModalProps) {
  const { history, isLoading, isError, refetch } =
    usePerizinanHistory(progressId);
  const [selectedItem, setSelectedItem] = useState<PerizinanHistoryItem | null>(
    null
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  const sortedHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return [...history].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [history]);

  const renderContent = () => {
    if (selectedItem) {
      return (
        <HistoryDetailView
          item={selectedItem}
          progressId={progressId}
          onBack={() => setSelectedItem(null)}
        />
      );
    }

    return (
      <>
        <div className="relative border-b border-gray-300 bg-gradient-to-r from-red-50 via-white to-red-50 px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <History className="w-5 h-5 text-white" />
            </div>
            Riwayat Perizinan
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full z-10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 lg:p-8 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500 h-40 flex items-center justify-center">
              Gagal memuat riwayat.
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center text-gray-500 h-40 flex items-center justify-center">
              Belum ada riwayat perubahan.
            </div>
          ) : (
            <div className="flow-root">
              <div className="-mb-4">
                {[...sortedHistory].reverse().map((item, index, arr) => {
                  const previousItem = arr[index + 1] || null;

                  return (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      previousItem={previousItem}
                      onSelect={() => setSelectedItem(item)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[80vh]">
        {renderContent()}
      </div>
    </div>,
    document.body
  );
}
