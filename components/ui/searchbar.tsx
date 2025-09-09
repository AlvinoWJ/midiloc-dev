"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
};

export default function SearchBar({
  value,
  onChange,
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex items-center w-[354px] h-[40px] max-w-md bg-white rounded-full shadow-[1px_1px_6px_rgba(0,0,0,0.25)] px-4 py-2"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ULOK"
        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
      />
      <button type="submit">
        <Search className="text-red-600 w-5 h-5 cursor-pointer" />
      </button>
    </form>
  );
}
