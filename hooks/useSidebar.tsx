"use client"; // Menandakan komponen berjalan di browser (mengakses window & localStorage)

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

/**
 * Tipe data untuk Context Sidebar.
 * Mendefinisikan apa saja yang bisa diakses oleh komponen child.
 */
type SidebarContextType = {
  isCollapsed: boolean; // Status apakah sidebar sedang tertutup (true) atau terbuka (false)
  setIsCollapsed: (value: boolean) => void; // Fungsi untuk set state manual (jarang dipakai langsung, biasanya pakai toggle)
  toggleSidebar: () => void; // Fungsi untuk membalik status (buka <-> tutup)
};

// Key untuk menyimpan preferensi user di Local Storage browser
const LOCAL_STORAGE_KEY = "sidebarCollapsed";

// Batas lebar layar (breakpoint) untuk mode mobile.
// Di bawah 768px, sidebar dianggap harus tertutup (collapsed) secara default.
const MOBILE_BREAKPOINT = 768;

// Membuat Context dengan nilai awal undefined (akan diisi oleh Provider)
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Provider Component: SidebarProvider
 * -----------------------------------
 * Komponen ini membungkus aplikasi (biasanya di layout) untuk menyediakan state sidebar.
 * Menangani logika responsif (auto-collapse di mobile) dan persistensi (ingat status terakhir).
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  // State default adalah 'false' (terbuka).
  // Nilai ini akan segera diperbarui oleh useEffect saat komponen dipasang (mount).
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Effect Utama: Mengatur state awal & memantau perubahan ukuran layar
  useEffect(() => {
    const checkScreenSize = () => {
      // Cek apakah lebar layar saat ini masuk kategori mobile
      const isMobileScreen = window.innerWidth < MOBILE_BREAKPOINT;

      if (isMobileScreen) {
        // LOGIKA MOBILE: Selalu paksa sidebar tertutup agar tidak menutupi konten
        setIsCollapsed(true);
      } else {
        // LOGIKA DESKTOP: Coba ambil preferensi user dari localStorage
        try {
          const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
          // Jika ada data tersimpan, parse JSON-nya. Jika tidak, default false (terbuka).
          setIsCollapsed(savedState !== null ? JSON.parse(savedState) : false);
        } catch (error) {
          // Fallback jika terjadi error saat parsing JSON (misal data korup)
          console.error(
            "Failed to parse sidebar state from localStorage",
            error
          );
          setIsCollapsed(false);
        }
      }
    };

    // 1. Jalankan pengecekan segera saat komponen pertama kali dimuat (Initial Load)
    checkScreenSize();

    // 2. Pasang event listener 'resize'
    // Agar saat user mengubah ukuran browser secara real-time, logika di atas berjalan lagi.
    window.addEventListener("resize", checkScreenSize);

    // Cleanup: Hapus event listener saat komponen di-unmount/dihancurkan
    // Sangat penting untuk mencegah memory leak di aplikasi SPA (Single Page Application).
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []); // Dependency array kosong [] artinya hanya berjalan sekali saat mount.

  /**
   * Fungsi Toggle
   * Mengubah status true <-> false dan menyimpan ke localStorage.
   * Menggunakan useCallback agar referensi fungsi tidak berubah setiap render (optimasi).
   */
  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      const isMobileScreen = window.innerWidth < MOBILE_BREAKPOINT;

      // LOGIKA PENYIMPANAN:
      // Kita hanya menyimpan preferensi ke localStorage jika user berada di DESKTOP.
      // Alasannya: Di mobile, sidebar tertutup karena keterbatasan layar,
      // bukan karena keinginan user untuk selamanya menutup sidebar.
      if (!isMobileScreen) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.error("Failed to save sidebar state to localStorage", error);
        }
      }
      return newState;
    });
  }, []);

  // Nilai yang akan disebar ke seluruh komponen child
  const value = { isCollapsed, setIsCollapsed, toggleSidebar };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

/**
 * Custom Hook: useSidebar
 * -----------------------
 * Cara aman untuk menggunakan SidebarContext.
 * Memastikan hook dipanggil di dalam <SidebarProvider>.
 */
export function useSidebar() {
  const context = useContext(SidebarContext);

  // Guard Clause: Lempar error deskriptif jika developer lupa membungkus komponen dengan Provider
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
