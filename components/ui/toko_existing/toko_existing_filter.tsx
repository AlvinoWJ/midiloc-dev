"use client";

/**
 * TokoExistingFilter
 * ------------------
 * Komponen filter & search untuk halaman daftar Toko Existing.
 *
 * Fitur utama:
 * - Search input + tombol clear (desktop & mobile)
 * - Filter per "Tahun Beroperasi"
 * - Filter per "Regional"
 * - Dropdown filter (desktop: floating - mobile: slide-down)
 *
 * Props:
 * - onSearch(value): Callback untuk melakukan pencarian
 * - onFilterChange(year, regional): Callback untuk perubahan filter
 *
 * Catatan:
 * - Komponen ini mendukung responsive layout menggunakan `useMediaQuery`
 */

import { useState } from "react";
import { Filter, X, Search } from "lucide-react";
import SearchBar from "@/components/ui/searchbar";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TokoExistingFilterProps {
  onSearch: (value: string) => void;
  onFilterChange: (year: string, regional: string) => void;
}

/**
 * mockRegionalOptions
 * -------------------
 * Opsi regional sementara (mock) sebagai dropdown filter Regional.
 */
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
}: TokoExistingFilterProps) {
  /**
   * State Management
   * ----------------
   * - search   : nilai input pencarian
   * - year     : filter tahun beroperasi
   * - regional : filter regional
   * - showFilter : menampilkan popup filter (berbeda untuk mobile & desktop)
   */
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [regional, setRegional] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  // Breakpoint responsive untuk membedakan tampilan mobile & desktop
  const isDesktop = useMediaQuery("(min-width: 768px)");

  /**
   * Search Handlers
   * ---------------
   * Mengatur perilaku ketika input search berubah, submit, atau dibersihkan.
   */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value === "") onSearch("");
  };

  const handleSearchSubmit = () => {
    onSearch(search.trim());
  };

  const handleSearchClear = () => {
    setSearch("");
    onSearch("");
  };

  /**
   * Filter Handlers
   * ----------------
   * Mengatur perubahan filter tahun dan regional, serta reset filter.
   */
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

  /**
   * Generate daftar tahun: tahun sekarang hingga 7 tahun sebelumnya
   */
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

  // Cek apakah ada filter aktif
  const isFilterActive = !!year || !!regional;

  /**
   * FilterContent
   * -------------
   * Komponen isi dropdown filter, digunakan untuk desktop & mobile.
   *
   * Props:
   * - isMobile: mengaktifkan UI yang berbeda untuk mobile
   */
  const FilterContent = ({ isMobile = false }) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-lg ${
        isMobile ? "mt-4" : "absolute right-0 top-14 min-w-[250px] z-50"
      }`}
    >
      {/* Header untuk mobile */}
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
        {/* Filter Tahun */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tahun Beroperasi
          </label>

          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-1 focus:ring-red-500 text-sm"
          >
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Regional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regional
          </label>

          <select
            value={regional}
            onChange={(e) => handleRegionalChange(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-1 focus:ring-red-500 text-sm"
          >
            <option value="">Semua Regional</option>
            {mockRegionalOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tombol Hapus Filter */}
        {isFilterActive && (
          <button
            onClick={clearFilters}
            className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Hapus Filter
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ============================================================
         DESKTOP VIEW
      ============================================================ */}
      <div className="hidden md:flex items-center gap-3 relative">
        {/* Komponen Search khusus desktop */}
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          onClear={handleSearchClear}
        />

        {/* Tombol Filter (floating dropdown) */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 ${
              isFilterActive
                ? "text-red-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Filter Data"
          >
            <Filter className="w-[18px] h-[18px]" />
          </button>

          {/* Dropdown filter untuk desktop */}
          {showFilter && isDesktop && <FilterContent />}
        </div>
      </div>

      {/* ============================================================
         MOBILE VIEW
      ============================================================ */}
      <div className="space-y-4 md:hidden">
        <div className="relative">
          {/* Search input mobile */}
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
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-base shadow-sm focus:ring-1 focus:ring-red-500"
            />

            {/* Tombol clear */}
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

          {/* Tombol filter untuk mobile */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
              isFilterActive
                ? "text-red-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Konten filter mobile */}
        {showFilter && !isDesktop && <FilterContent isMobile={true} />}
      </div>
    </>
  );
}
