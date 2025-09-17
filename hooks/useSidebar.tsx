"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useDeviceType } from "./useDeviceType";

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
};

const LOCAL_STORAGE_KEY = "sidebarCollapsed";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { isMobile } = useDeviceType();
  const getInitialState = () => {
    // Untuk mobile, sidebar selalu default terlipat (true).
    // Untuk desktop, sidebar selalu default terbuka (false).
    return isMobile ? true : false;
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialState);

  useEffect(() => {
    // Saat tipe perangkat berubah (misal dari desktop ke mobile karena resize),
    // atur ulang state ke nilai default yang sesuai.
    setIsCollapsed(getInitialState());
  }, [isMobile]);

  useEffect(() => {
    // Saat komponen pertama kali mount di client, coba baca dari localStorage.
    // Ini untuk mengingat preferensi pengguna di sesi sebelumnya (khusus desktop).
    if (!isMobile) {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
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
