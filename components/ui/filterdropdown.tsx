"use client";

import { useEffect, useRef } from "react";

type FilterDropdownProps = {
  month: string;
  year: string;
  setMonth: (value: string) => void;
  setYear: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
};

export default function FilterDropdown({
  month,
  year,
  setMonth,
  setYear,
  show,
  setShow,
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Klik luar → tutup filter
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShow]);

  if (!show) return null;

  return (
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
            onChange={(e) => setMonth(e.target.value)}
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
            onChange={(e) => setYear(e.target.value)}
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
  );
}
