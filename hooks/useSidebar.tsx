"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useDevice } from "@/app/context/DeviceContext";

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const LOCAL_STORAGE_KEY = "sidebarCollapsed";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { isMobile } = useDevice();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Karena `isMobile` sudah benar sejak awal, kita bisa langsung check
    if (isMobile) {
      return true; // Di mobile, sidebar selalu mulai dalam keadaan tertutup
    }

    // Untuk desktop, kita cek localStorage
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState !== null) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to parse sidebar state from localStorage", error);
    }

    // Jika tidak ada di localStorage, default untuk desktop adalah terbuka
    return false;
  });

  //3. Jaga agar state tetap sesuai jika user mengubah ukuran window
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    } else {
      // Saat kembali ke desktop, kembalikan ke state terakhir yang tersimpan atau default
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      setIsCollapsed(savedState !== null ? JSON.parse(savedState) : false);
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      // Simpan preferensi hanya jika pengguna di desktop
      if (!isMobile) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      }
      return newState;
    });
  }, [isMobile]);

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
