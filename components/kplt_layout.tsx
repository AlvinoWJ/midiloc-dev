"use client";

import { KpltPageProps } from "@/types/common";
import Tabs from "@/components/ui/tabs";
import SearchWithFilter from "@/components/ui/searchwithfilter";
import { InfoCard } from "@/components/ui/infocard";
import { useState, useMemo } from "react";
import { KpltSkeleton } from "./ui/skleton";

// Helper component for the chevron icon to keep JSX cleaner
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
      isExpanded ? "rotate-0" : "-rotate-90"
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export default function KpltLayout(props: KpltPageProps) {
  const {
    isLoading,
    isError,
    activeTab,
    displayData,
    searchQuery,
    filterMonth,
    filterYear,
    onSearch,
    onFilterChange,
    onTabChange,
  } = props;

  const [expandedStatuses, setExpandedStatuses] = useState<{
    [key: string]: boolean;
  }>({
    "need input": true,
    "in progress": true,
    "waiting for forum": true,
  });

  const groupedData = useMemo(() => {
    if (activeTab !== "Recent") return {};
    return displayData.reduce((acc, item) => {
      const status = item.status.toLowerCase();
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(item);
      return acc;
    }, {} as { [key: string]: typeof displayData });
  }, [displayData, activeTab]);

  const statusOrder = ["need input", "in progress", "waiting for forum"];
  const toggleStatus = (status: string) => {
    setExpandedStatuses((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const getStatusBadgeClass = (status: string): string => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "need input":
        return "bg-gray-300 text-white"; // Merah untuk menandakan butuh tindakan
      case "in progress":
        return "bg-progress text-white"; // Kuning untuk status berjalan
      case "waiting for forum":
        return "bg-progress text-white"; // Biru untuk status menunggu
      default:
        return "bg-gray-200 text-gray-800"; // Warna default
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "need input":
        return "Need Input";
      case "in progress":
        return "In Progress";
      case "waiting for forum":
        return "Waiting for Forum";
      default:
        return status;
    }
  };

  return (
    <main className="space-y-4 lg:space-y-6">
      {isLoading ? (
        <KpltSkeleton accordionCount={3} cardsPerAccordion={3} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white p-6 rounded-lg shadow-sm border w-full max-w-md">
            <div className="text-red-500 text-4xl md:text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Gagal Memuat Data
            </h3>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              Terjadi kesalahan saat mengambil data KPLT. Silakan coba lagi.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full md:w-auto"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-bold">KPLT</h1>
            <SearchWithFilter
              onSearch={onSearch}
              onFilterChange={onFilterChange}
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between">
            <Tabs
              tabs={["Recent", "History"]}
              onTabChange={onTabChange}
              activeTab={activeTab}
            />
          </div>

          {/* Konten Utama */}
          {displayData.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <div className="text-gray-300 text-5xl md:text-6xl mb-4">📍</div>
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterMonth || filterYear
                  ? "Tidak ada data yang cocok"
                  : "Belum ada data KPLT"}
              </h3>
              <p className="text-gray-500 text-sm md:text-base max-w-md">
                {searchQuery || filterMonth || filterYear
                  ? "Coba ubah kata kunci pencarian atau filter untuk menemukan data yang Anda cari."
                  : activeTab === "Recent"
                  ? "Mulai dengan menambahkan KPLT baru."
                  : "Belum ada data riwayat KPLT."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === "Recent" && (
                <div className="space-y-6">
                  {statusOrder.map((status) => {
                    const items = groupedData[status];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={status}>
                        <button
                          onClick={() => toggleStatus(status)}
                          className="flex items-center gap-3 text-left w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <ChevronIcon isExpanded={expandedStatuses[status]} />
                          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                            {getStatusLabel(status)}
                          </h2>
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {items.length}
                          </span>
                        </button>
                        {expandedStatuses[status] && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
                            {items.map((kplt) => (
                              <InfoCard
                                key={kplt.id}
                                id={kplt.id}
                                nama={kplt.nama}
                                alamat={kplt.alamat}
                                created_at={kplt.created_at}
                                status={kplt.status}
                                detailPath={
                                  kplt.status.toLowerCase() === "need input"
                                    ? `/form_kplt/tambah/`
                                    : `/form_kplt/detail/`
                                }
                                has_file_intip={kplt.has_file_intip}
                                has_form_ukur={kplt.has_form_ukur}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "History" && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
                  {displayData.map((kplt) => (
                    <InfoCard
                      key={kplt.id}
                      id={kplt.id}
                      nama={kplt.nama}
                      alamat={kplt.alamat}
                      created_at={kplt.created_at}
                      status={kplt.status}
                      detailPath={`/form_kplt/detail/`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
