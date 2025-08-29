"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter } from "lucide-react";

export default function SearchBar() {
  const [showFilter, setShowFilter] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Klik luar → tutup filter
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setShowFilter(true);
  };

  const handleYearChange = (value: string) => {
    setYear(value);
    setShowFilter(false); // tutup setelah pilih
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Input + Search icon */}
      <div className="flex items-center w-[354px] h-[40px] max-w-md bg-white rounded-full shadow-[1px_1px_6px_rgba(0,0,0,0.25)] px-4 py-2">
        <input
          type="text"
          placeholder="Search ULOK"
          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
        />
        <Search className="text-red-600 w-5 h-5 cursor-pointer" />
      </div>

      {/* Filter button */}
      <button
        onClick={() => setShowFilter(!showFilter)}
        className="flex items-center justify-center bg-white shadow-[1px_1px_6px_rgba(0,0,0,0.25)] rounded-xl w-[46px] h-[46px] p-2 hover:bg-gray-100"
      >
        <Filter className="text-red-600 w-[18px] h-[18px]" />
      </button>

      {/* Dropdown Filter */}
      {showFilter && (
        <div
          ref={dropdownRef}
          className="absolute top-14 right-0 bg-white shadow-lg rounded-xl p-4 w-72 z-50"
        >
          <h3 className="text-sm font-semibold mb-3">Filter</h3>
          <div className="flex gap-3">
            {/* Bulan */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Bulan</label>
              <select
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
              >
                <option value="">Semua</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>
            </div>

            {/* Tahun */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Tahun</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full border rounded-md px-2 py-1 text-sm"
              >
                <option value="">Semua</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
