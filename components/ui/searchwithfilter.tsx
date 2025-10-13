"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import SearchBar from "@/components/ui/searchbar";
import FilterDropdown from "@/components/ui/filterdropdown";
import { useMediaQuery } from "@/hooks/use-media-query";

// 1. Interface props yang sama untuk keduanya
interface SearchWithFilterProps {
  onSearch: (value: string) => void;
  onFilterChange: (month: string, year: string) => void;
}

export default function SearchWithFilter({
  onSearch,
  onFilterChange,
}: SearchWithFilterProps) {
  // ========================================================================
  // 2. State dan Logika Disatukan di Sini
  // ========================================================================
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Fungsi-fungsi ini akan digunakan oleh kedua versi UI
  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const handleMonthChange = (value: string) => {
    setMonth(value);
    onFilterChange(value, year);
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    onFilterChange(month, value);
  };

  const clearFilters = () => {
    setMonth("");
    setYear("");
    onFilterChange("", "");
  };

  // Data untuk filter (diambil dari versi mobile)
  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // ========================================================================
  // 3. UI Rendering: Pilih JSX berdasarkan ukuran layar
  // ========================================================================
  return (
    <>
      {/* ----------------- Tampilan Desktop ----------------- */}
      {/* Tampil jika layar medium atau lebih besar (md:flex) */}
      <div className="hidden md:flex items-center gap-5 relative">
        <SearchBar value={search} onChange={handleSearchChange} />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 hover:bg-gray-100"
        >
          <Filter className="text-red-600 w-[18px] h-[18px]" />
        </button>
        {showFilter && isDesktop && (
          <FilterDropdown
            month={month}
            year={year}
            setMonth={handleMonthChange}
            setYear={handleYearChange}
            show={showFilter}
            setShow={setShowFilter}
          />
        )}
      </div>

      {/* ----------------- Tampilan Mobile ----------------- */}
      {/* Tampil jika layar kecil (block), sembunyi di layar medium ke atas (md:hidden) */}
      <div className="space-y-4 md:hidden">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari usulan lokasi..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 bg-white px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors duration-200 ${
              showFilter ? "text-red-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Filter Panel (Expandable) */}
        {showFilter && !isDesktop && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filter</h3>
              <button
                onClick={() => setShowFilter(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {/* Month & Year Selectors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:shadow-md focus:border-gray-300 transition-all duration-200"
                >
                  <option value="">Semua Bulan</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:shadow-md focus:border-gray-300 transition-all duration-200"
                >
                  <option value="">Semua Tahun</option>
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {(month || year) && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                >
                  Hapus Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
