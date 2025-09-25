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

  // default state dulu
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    isMobile ? true : false
  );

  // Load state dari localStorage hanya di client
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isMobile) {
      setIsCollapsed(true);
    } else {
      try {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        setIsCollapsed(savedState !== null ? JSON.parse(savedState) : false);
      } catch (error) {
        console.error("Failed to parse sidebar state from localStorage", error);
        setIsCollapsed(false);
      }
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      if (!isMobile && typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
          console.error("Failed to save sidebar state to localStorage", error);
        }
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
