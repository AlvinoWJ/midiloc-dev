"use client";

import { KpltPageProps } from "@/types/common";
import Tabs from "@/components/ui/tabs"; // Gunakan satu komponen Tabs yang responsif
import SearchWithFilter from "@/components/ui/searchwithfilter"; // Gunakan satu Search yang responsif
import { InfoCard } from "@/components/ui/infocard";
import { useState, useMemo } from "react";

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
    const groups: { [key: string]: typeof displayData } = {
      "need input": [],
      "in progress": [],
      "waiting for forum": [],
    };
    displayData.forEach((kplt) => {
      const status = kplt.status.toLowerCase();
      if (groups[status] !== undefined) {
        groups[status].push(kplt);
      }
    });
    return groups;
  }, [displayData]);

  const toggleStatus = (status: string) => {
    setExpandedStatuses((prev) => ({ ...prev, [status]: !prev[status] }));
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
        <div>
          <div className="h-9 w-1/2 md:w-1/3 bg-gray-200 rounded animate-pulse"></div>
          <div className="mt-6 h-[500px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
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
              {Object.entries(groupedData).map(([status, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={status}>
                    {/* Status Header (Accordion Toggle) */}
                    <button
                      onClick={() => toggleStatus(status)}
                      className="flex items-center gap-3 text-left w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChevronIcon isExpanded={expandedStatuses[status]} />
                      <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                        {getStatusLabel(status)}
                      </h2>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        {items.length}
                      </span>
                    </button>

                    {/* Cards Grid yang bisa di-collapse */}
                    {expandedStatuses[status] && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
                        {items.map((kplt) => {
                          const statusLower = kplt.status.toLowerCase();
                          const destinationUrl =
                            statusLower === "need input"
                              ? `/form_kplt/tambah/`
                              : `/form_kplt/detail/`;

                          return (
                            <InfoCard
                              key={kplt.id}
                              id={kplt.id}
                              nama={kplt.nama}
                              alamat={kplt.alamat}
                              created_at={kplt.created_at}
                              status={kplt.status}
                              detailPath={destinationUrl}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
