"use client";

import { createContext, useContext, ReactNode } from "react";

// Tipe untuk nilai context
type DeviceContextType = {
  isMobile: boolean;
};

// Buat context dengan nilai default
const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

// Buat Provider component
export function DeviceProvider({
  children,
  isMobile,
}: {
  children: ReactNode;
  isMobile: boolean;
}) {
  return (
    <DeviceContext.Provider value={{ isMobile }}>
      {children}
    </DeviceContext.Provider>
  );
}

// Buat custom hook untuk menggunakan context ini
export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}
