"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * FilterDropdown
 * --------------
 * Komponen dropdown untuk filter berdasarkan bulan & tahun.
 *
 * Fitur:
 * - Menampilkan daftar bulan dan tahun dalam bentuk grid.
 * - User dapat memilih bulan atau tahun secara langsung (langsung apply).
 * - Auto-close ketika user klik di luar dropdown.
 * - Tombol Reset Filter untuk mengembalikan ke kondisi default.
 *
 * Props:
 * - month (string): Nilai bulan yang sedang terpilih.
 * - year (string): Nilai tahun yang sedang terpilih.
 * - onApply(month, year): Callback untuk menerapkan perubahan filter.
 * - show (boolean): Menentukan apakah dropdown ditampilkan.
 * - setShow(boolean): Fungsi untuk membuka/menutup dropdown.
 */

type FilterDropdownProps = {
  month: string;
  year: string;
  onApply: (month: string, year: string) => void;
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
  // Untuk mendeteksi klik di luar dropdown → auto-close.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ambil tahun saat ini sebagai dasar list tahun.
  const currentYear = new Date().getFullYear();

  // Generate list 6 tahun terakhir, misal: 2025 → 2020.
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Daftar bulan (value & label).
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

  /**
   * Efek untuk menutup dropdown ketika user klik di luar elemen.
   */
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

  // Jika dropdown tidak sedang dibuka → tidak render apapun.
  if (!show) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-14 right-0 bg-white shadow-xl border border-gray-100 rounded-xl p-5 w-[340px] z-50 animate-in fade-in zoom-in-95 duration-200"
    >
      {/* Header dropdown */}
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="font-semibold text-gray-800">Filter Data</h3>

        {/* Tombol penutup dropdown */}
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        {/* ============================
            BAGIAN FILTER TAHUN
        ============================= */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Tahun
          </label>

          <div className="grid grid-cols-4 gap-2">
            {/* Tombol reset tahun */}
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

            {/* List Tahun */}
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

        {/* ============================
            BAGIAN FILTER BULAN
        ============================= */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
            Bulan
          </label>

          <div className="grid grid-cols-4 gap-2">
            {/* Tombol reset bulan */}
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

            {/* List Bulan */}
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

      {/* ============================
          FOOTER — RESET FILTER
      ============================= */}
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
