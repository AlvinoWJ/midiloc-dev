"use client";

/**
 * Interface untuk props AddButton.
 * @param label - Teks yang ditampilkan pada tombol (Default: "+ Add").
 * @param onClick - Fungsi callback yang dijalankan saat tombol diklik.
 */
interface AddButtonProps {
  label?: string;
  onClick?: () => void;
}

/**
 * Komponen Tombol Tambah (Reusable).
 * Biasa digunakan di header halaman untuk aksi "Create New".
 * * Perilaku Responsif:
 * - Mobile: Lebar penuh (w-full).
 * - Desktop (md): Lebar tetap (183px) dengan shadow custom.
 */
export default function AddButton({
  label = "+ Add",
  onClick,
}: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        /* --- Mobile Styles (Default) --- */
        w-full 
        bg-primary 
        text-primary-foreground 
        py-3 px-6 
        rounded-xl 
        font-semibold 
        shadow-md 
        
        /* --- Desktop Styles (screen >= 768px) --- */
        md:w-[183px] 
        md:py-2 
        md:rounded-2xl 
        md:text-xl 
        md:shadow-[1px_1px_6px_rgba(0,0,0,0.25)]
        
        /* --- Interactions --- */
        hover:bg-red-700 
        transition-colors 
        duration-200
      "
    >
      {label}
    </button>
  );
}
