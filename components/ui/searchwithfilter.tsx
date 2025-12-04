"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import SearchBar from "@/components/ui/searchbar";
import FilterDropdown from "@/components/ui/filterdropdown";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SearchWithFilterProps {
  onSearch: (value: string) => void; // callback pencarian
  onFilterChange: (month: string, year: string) => void; // callback filter
}

export default function SearchWithFilter({
  onSearch,
  onFilterChange,
}: SearchWithFilterProps) {
  // -------------------- State --------------------
  const [search, setSearch] = useState(""); // input teks pencarian
  const [month, setMonth] = useState(""); // nilai filter bulan
  const [year, setYear] = useState(""); // nilai filter tahun
  const [showFilter, setShowFilter] = useState(false); // toggle dropdown filter
  const isDesktop = useMediaQuery("(min-width: 768px)"); // cek ukuran layar

  // -------------------- Handler Pencarian --------------------

  // Update input search tanpa langsung trigger pencarian
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value === "") {
      onSearch(""); // reset data ketika input dikosongkan
    }
  };

  // Trigger ketika tekan Enter atau klik tombol Search
  const handleSearchSubmit = () => {
    onSearch(search.trim());
  };

  // Tombol X di searchbar → clear input + reset data
  const handleSearchClear = () => {
    setSearch("");
    onSearch("");
  };

  // -------------------- Handler Filter --------------------

  // Update filter bulan
  const handleMonthChange = (value: string) => {
    setMonth(value);
    onFilterChange(value, year);
  };

  // Update filter tahun
  const handleYearChange = (value: string) => {
    setYear(value);
    onFilterChange(month, value);
  };

  // Update sekaligus (khusus desktop dropdown)
  const handleFilterChange = (newMonth: string, newYear: string) => {
    setMonth(newMonth);
    setYear(newYear);
    onFilterChange(newMonth, newYear);
  };

  // Reset semua filter
  const clearFilters = () => {
    setMonth("");
    setYear("");
    onFilterChange("", "");
  };

  // -------------------- Data Bulan & Tahun --------------------

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
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // list 5 tahun terakhir

  return (
    <>
      {/* =========================================================
          DESKTOP VIEW
          ========================================================= */}
      <div className="hidden md:flex items-center gap-3 relative">
        {/* Komponen SearchBar terpisah */}
        <SearchBar
          value={search}
          onChange={handleSearchChange} // update input
          onSubmit={handleSearchSubmit} // enter/klik search
          onClear={handleSearchClear} // clear input
        />

        {/* Tombol filter, menjadi merah jika filter aktif */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 transition-colors ${
              month || year // highlight jika ada filter aktif
                ? "text-red-600"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Filter Data"
          >
            <Filter
              className={`w-[18px] h-[18px] ${
                month || year ? "text-red-600" : ""
              }`}
            />
          </button>

          {/* Dropdown filter (hanya untuk desktop) */}
          {showFilter && isDesktop && (
            <FilterDropdown
              month={month}
              year={year}
              onApply={(m, y) => handleFilterChange(m, y)} // apply filter sekaligus
              show={showFilter}
              setShow={setShowFilter}
            />
          )}
        </div>
      </div>

      {/* =========================================================
          MOBILE VIEW
          ========================================================= */}
      <div className="space-y-4 md:hidden">
        <div className="relative">
          {/* Form pencarian mobile */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(search.trim());
            }}
          >
            {/* Ikon search kiri */}
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            {/* Input pencarian */}
            <input
              type="text"
              placeholder="Cari usulan lokasi..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (value === "") onSearch(""); // reset
              }}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 bg-white text-base shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />

            {/* Tombol clear (X) di input mobile */}
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

          {/* Tombol filter mobile */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors duration-200 ${
              showFilter ? "text-red-600" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Panel filter mobile */}
        {showFilter && !isDesktop && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            {/* Header filter */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filter</h3>
              <button
                onClick={() => setShowFilter(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Input Bulan & Tahun */}
            <div className="space-y-4">
              {/* Dropdown Bulan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bulan
                </label>
                <select
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:shadow-md"
                >
                  <option value="">Semua Bulan</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown Tahun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun
                </label>
                <select
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg bg-white shadow-sm focus:outline-none focus:shadow-md"
                >
                  <option value="">Semua Tahun</option>
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tombol reset filter */}
              {(month || year) && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium"
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
