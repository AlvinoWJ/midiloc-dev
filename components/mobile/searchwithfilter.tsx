// mobile-searchwithfilter.tsx
import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface MobileSearchWithFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
}

export default function MobileSearchWithFilter({
  onSearch,
  onFilterChange,
}: MobileSearchWithFilterProps) {
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Cari usulan lokasi..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
            showFilter ? "text-red-600" : "text-gray-400"
          }`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filter</h3>
            <button
              onClick={() => setShowFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulan
              </label>
              <select
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Semua Bulan</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahun
              </label>
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Semua Tahun</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
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
  );
}
