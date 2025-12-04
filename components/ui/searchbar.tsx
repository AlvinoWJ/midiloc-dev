"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string; // nilai input
  onChange: (value: string) => void; // handler perubahan input
  onSubmit?: () => void; // optional submit handler
  onClear?: () => void; // optional clear handler
};

/**
 * SearchBar Component
 * -------------------
 * Komponen pencarian dengan fitur:
 * - Input pencarian
 * - Tombol submit (ikon Search)
 * - Tombol clear (ikon X) yang muncul hanya ketika input berisi teks
 *
 * Props:
 * - value: string → nilai teks input
 * - onChange(value): dipanggil setiap kali user mengetik
 * - onSubmit(): dipanggil saat user menekan Enter atau klik tombol search
 * - onClear(): opsional, dipanggil ketika tombol clear ditekan
 */
export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault(); // cegah reload page
        onSubmit?.(); // panggil handler jika disediakan
      }}
      className="
        flex items-center w-[354px] h-[40px] max-w-md 
        bg-white rounded-full 
        shadow-[1px_1px_6px_rgba(0,0,0,0.25)] 
        px-4 py-2 relative
      "
    >
      {/* Input pencarian */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ULOK"
        className="
          flex-1 outline-none text-sm text-gray-700 
          placeholder-gray-400 pr-8
        "
      />

      {/* Tombol clear hanya muncul jika input tidak kosong */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange(""); // kosongkan input
            onClear?.(); // trigger reset list jika ada handler
          }}
          className="absolute right-10 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Tombol submit (ikon search) */}
      <button type="submit">
        <Search className="text-red-600 w-5 h-5 cursor-pointer" />
      </button>
    </form>
  );
}
