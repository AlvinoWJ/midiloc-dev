"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const LOCAL_STORAGE_KEY = "sidebarCollapsed";
const MOBILE_BREAKPOINT = 768; // Lebar layar dalam pixel untuk dianggap mobile (bisa disesuaikan)

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // State default adalah 'false' (terbuka), useEffect akan menyesuaikannya.
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    // Fungsi ini akan mengecek ukuran layar dan mengatur state
    const checkScreenSize = () => {
      const isMobileScreen = window.innerWidth < MOBILE_BREAKPOINT;

      if (isMobileScreen) {
        // Jika layar mobile, selalu paksa sidebar untuk collapsed
        setIsCollapsed(true);
      } else {
        // Jika layar desktop, coba ambil state dari localStorage
        try {
          const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
          // Jika ada state tersimpan, gunakan itu. Jika tidak, default-nya 'false' (terbuka).
          setIsCollapsed(savedState !== null ? JSON.parse(savedState) : false);
        } catch (error) {
          console.error(
            "Failed to parse sidebar state from localStorage",
            error
          );
          setIsCollapsed(false);
        }
      }
    };

    // Jalankan pengecekan saat komponen pertama kali dimuat
    checkScreenSize();

    // Tambahkan event listener untuk memantau perubahan ukuran window
    window.addEventListener("resize", checkScreenSize);

    // Cleanup: Hapus event listener saat komponen di-unmount untuk mencegah memory leak
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []); // Dependency array kosong agar useEffect ini hanya berjalan sekali saat mount

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      const isMobileScreen = window.innerWidth < MOBILE_BREAKPOINT;

      // Hanya simpan state ke localStorage jika di layar desktop
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

  const value = { isCollapsed, setIsCollapsed, toggleSidebar };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
