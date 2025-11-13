"use client";

import { Search, X } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void; // tambahkan optional clear handler
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex items-center w-[354px] h-[40px] max-w-md bg-white rounded-full shadow-[1px_1px_6px_rgba(0,0,0,0.25)] px-4 py-2 relative"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ULOK"
        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 pr-8"
      />

      {/* Tombol clear (X) muncul hanya jika ada teks */}
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange(""); // hapus teks
            onClear?.(); // panggil fungsi reset data
          }}
          className="absolute right-10 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <button type="submit">
        <Search className="text-red-600 w-5 h-5 cursor-pointer" />
      </button>
    </form>
  );
}
