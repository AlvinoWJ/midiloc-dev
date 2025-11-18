"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type FilterDropdownProps = {
  month: string;
  year: string;
  onApply: (month: string, year: string) => void; // Fungsi untuk apply sekaligus
  show: boolean;
  setShow: (value: boolean) => void;
};

export default function FilterDropdown({
  month,
  year,
  onApply,
  show,
  setShow,
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State lokal untuk menampung pilihan sebelum user klik "Terapkan" (opsional)
  // Atau kita bisa langsung update (seperti behavior dashboard biasanya).
  // Di sini saya buat langsung update agar UX-nya cepat.

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i); // 2025, 2024, ...

  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Ags" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Okt" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Des" },
  ];

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
      className="absolute top-14 right-0 bg-white shadow-xl border border-gray-100 rounded-xl p-5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="font-semibold text-gray-800">Filter Data</h3>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        {/* Bagian TAHUN (Gaya Grid / YearPicker Style) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Tahun
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* Tombol 'All' untuk reset tahun */}
            <button
              onClick={() => onApply(month, "")}
              className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                year === ""
                  ? "bg-red-600 text-white border-red-600 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
              }`}
            >
              All
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => onApply(month, y.toString())}
                className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                  year === y.toString()
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Bagian BULAN (Gaya Grid untuk konsistensi) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Bulan
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onApply("", year)}
              className={`px-2 py-2 text-sm rounded-lg border transition-all col-span-4 ${
                month === ""
                  ? "bg-red-600 text-white border-red-600 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
              }`}
            >
              Semua Bulan
            </button>
            {months.map((m) => (
              <button
                key={m.value}
                onClick={() => onApply(m.value, year)}
                className={`px-2 py-2 text-sm rounded-lg border transition-all ${
                  month === m.value
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Reset All */}
      <div className="mt-6 pt-3 border-t flex justify-end">
        <button
          onClick={() => {
            onApply("", "");
            setShow(false);
          }}
          className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
        >
          Reset Filter
        </button>
      </div>
    </div>
  );
}
