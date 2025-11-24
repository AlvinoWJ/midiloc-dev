"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  History,
  Loader2,
  FileText,
  LinkIcon,
  ArrowLeft,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotarisHistory,
  NotarisHistoryItem,
} from "@/hooks/progress_kplt/useNotarisHistory";

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
  current: NotarisHistoryItem["data"],
  previous: NotarisHistoryItem["data"] | null
): string[] {
  if (!previous) {
    return ["Mencatat data awal."];
  }

  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);

  const fieldLabels: Record<string, string> = {
    awal_sewa: "Awal Sewa",
    akhir_sewa: "Akhir Sewa",
    tanggal_par: "Tgl PAR",
    validasi_legal: "Validasi Legal",
    tanggal_validasi_legal: "Tgl Validasi Legal",
    tanggal_plan_notaris: "Tgl Plan Notaris",
    tanggal_notaris: "Tgl Notaris",
    status_notaris: "Status Notaris",
    status_pembayaran: "Status Pembayaran",
    tanggal_pembayaran: "Tgl Pembayaran",
    par_online: "File PAR Online",
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
        changes.push(`Menambahkan ${label}.`);
      } else {
        changes.push(`Mengubah ${label}.`);
      }
    }
  });

  return changes.length > 0 ? changes : ["Pembaruan Status."];
}

interface HistoryItemProps {
  item: NotarisHistoryItem;
  previousItem: NotarisHistoryItem | null;
  onSelect: () => void;
}

// Komponen kecil untuk menampilkan satu item riwayat
const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  previousItem,
  onSelect,
}) => {
  const currentStatus = item.data?.final_status_notaris;
  const prevStatus = previousItem?.data?.final_status_notaris;
  const dataChanges = getChanges(item.data, previousItem?.data || null);

  let statusChangeElement: React.ReactNode = null;
  if (currentStatus !== prevStatus) {
    statusChangeElement = (
      <p className="text-sm text-gray-700">
        Status Notaris{" "}
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

const FileLink: React.FC<{
  label: string;
  fileKey: string | null | undefined;
  progressId: string;
}> = ({ label, fileKey, progressId }) => {
  const href = fileKey
    ? `/api/files/notaris/${progressId}?path=${encodeURIComponent(
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
  item: NotarisHistoryItem;
  progressId: string;
  onBack: () => void;
}> = ({ item, progressId, onBack }) => {
  const data = item.data || {};

  return (
    <>
      <div className="relative border-b border-gray-300 bg-gradient-to-r from-red-50 via-white to-red-50 px-6 py-5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <span>Detail Riwayat</span>
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
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
            label="Awal Sewa"
            value={formatDateOnly(data.awal_sewa)}
          />
          <DetailField
            label="Akhir Sewa"
            value={formatDateOnly(data.akhir_sewa)}
          />
          <DetailField
            label="Tanggal PAR"
            value={formatDateOnly(data.tanggal_par)}
          />
          <DetailField label="Validasi Legal" value={data.validasi_legal} />
          <DetailField
            label="Tanggal Validasi Legal"
            value={formatDateOnly(data.tanggal_validasi_legal)}
          />
          <DetailField
            label="Tanggal Plan Notaris"
            value={formatDateOnly(data.tanggal_plan_notaris)}
          />
          <DetailField
            label="Tanggal Notaris"
            value={formatDateOnly(data.tanggal_notaris)}
          />
          <DetailField label="Status Notaris" value={data.status_notaris} />
          <DetailField
            label="Status Pembayaran"
            value={data.status_pembayaran}
          />
          <DetailField
            label="Tanggal Pembayaran"
            value={formatDateOnly(data.tanggal_pembayaran)}
          />
          <DetailField label="Status Final" value={data.final_status_notaris} />
          <DetailField
            label="Tanggal Selesai"
            value={formatDateOnly(data.tgl_selesai_notaris)}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-600 text-sm mb-2">Dokumen</h3>
          <FileLink
            label="File PAR Online"
            fileKey={data.par_online}
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

export function NotarisHistoryModal({
  progressId,
  onClose,
}: HistoryModalProps) {
  const { history, isLoading, isError } = useNotarisHistory(progressId);
  const [selectedItem, setSelectedItem] = useState<NotarisHistoryItem | null>(
    null
  );

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
            Riwayat Notaris
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
