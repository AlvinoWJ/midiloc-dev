// components/ui/toko_existing/toko_existing_filter.tsx
"use client";

import { useState } from "react";
import { Filter, X, Search } from "lucide-react";
import SearchBar from "@/components/ui/searchbar";
import { useMediaQuery } from "@/hooks/use-media-query"; // Asumsi hook ini ada

interface TokoExistingFilterProps {
  onSearch: (value: string) => void;
  onFilterChange: (year: string, regional: string) => void;
  // Mock property untuk simulasi pemeriksaan peran pengguna
  userRole: "Staff" | "Region Manager" | "General Manager";
}

// Data Regional Mock
const mockRegionalOptions = [
  { value: "Jakarta Barat", label: "Jakarta Barat" },
  { value: "Tangerang Selatan", label: "Tangerang Selatan" },
  { value: "Bekasi", label: "Bekasi" },
  { value: "Bogor", label: "Bogor" },
  { value: "Jakarta Selatan", label: "Jakarta Selatan" },
  { value: "Jakarta Utara", label: "Jakarta Utara" },
  { value: "Depok", label: "Depok" },
  { value: "Jakarta Pusat", label: "Jakarta Pusat" },
];

export default function TokoExistingFilter({
  onSearch,
  onFilterChange,
  userRole,
}: TokoExistingFilterProps) {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [regional, setRegional] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)"); // Asumsi hook ini tersedia

  // Logika untuk menentukan apakah filter regional diizinkan
  const isRegionalFilterAllowed =
    userRole === "Region Manager" || userRole === "General Manager";

  // --- Search Handlers (diambil dari SearchWithFilter) ---
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value === "") {
      onSearch("");
    }
  };

  const handleSearchSubmit = () => {
    onSearch(search.trim());
  };

  const handleSearchClear = () => {
    setSearch("");
    onSearch("");
  };

  // --- Filter Handlers ---
  const handleYearChange = (value: string) => {
    setYear(value);
    onFilterChange(value, regional);
  };

  const handleRegionalChange = (value: string) => {
    setRegional(value);
    onFilterChange(year, value);
  };

  const clearFilters = () => {
    setYear("");
    setRegional("");
    onFilterChange("", "");
  };

  const currentYear = new Date().getFullYear();
  // Generate tahun: tahun saat ini dan 7 tahun ke belakang
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);
  const isFilterActive = !!year || !!regional;

  // Konten Dropdown Filter (digunakan untuk desktop dan mobile)
  const FilterContent = ({ isMobile = false }) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-lg ${
        isMobile ? "mt-4" : "absolute right-0 top-14 min-w-[250px] z-50"
      }`}
    >
      {isMobile && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Filter</h3>
          <button
            onClick={() => setShowFilter(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
      )}
      <div className="space-y-4">
        {/* Tahun Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun Beroperasi
          </label>
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all duration-200 text-sm"
          >
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Regional Filter (Conditional) */}
        {isRegionalFilterAllowed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regional
            </label>
            <select
              value={regional}
              onChange={(e) => handleRegionalChange(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 transition-all duration-200 text-sm"
            >
              <option value="">Semua Regional</option>
              {mockRegionalOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isFilterActive && (
          <button
            onClick={clearFilters}
            className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
          >
            Hapus Filter
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ----------------- Desktop ----------------- */}
      <div className="hidden md:flex items-center gap-3 relative">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          onClear={handleSearchClear}
        />

        {/* Tombol Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 transition-colors ${
              isFilterActive
                ? "text-red-600"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Filter Data"
          >
            <Filter
              className={`w-[18px] h-[18px] ${
                isFilterActive ? "text-red-600" : ""
              }`}
            />
          </button>

          {showFilter && isDesktop && <FilterContent />}
        </div>
      </div>

      {/* ----------------- Mobile ----------------- */}
      <div className="space-y-4 md:hidden">
        <div className="relative">
          {/* Mobile Search Input and Filter Button (adapted from SearchWithFilter) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama atau alamat toko..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (value === "") handleSearchClear();
              }}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 bg-white text-base shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-lg"
            />

            {search && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </form>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors duration-200 ${
              isFilterActive
                ? "text-red-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Mobile Filter Dropdown Content */}
        {showFilter && !isDesktop && <FilterContent isMobile={true} />}
      </div>
    </>
  );
}
