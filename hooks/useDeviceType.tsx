"use client";

import { useState, useEffect } from "react";

const TABLET_BREAKPOINT = 965;
const DESKTOP_BREAKPOINT = 1024;
const DEBOUNCE_DELAY = 150;

interface DeviceType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isDeviceLoading: boolean;
  width?: number;
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isDeviceLoading: true,
    width: undefined,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        // 3. Setelah deteksi, set isDeviceLoading ke false
        setDeviceType({
          isMobile: width < TABLET_BREAKPOINT,
          isTablet: width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT,
          isDesktop: width >= DESKTOP_BREAKPOINT,
          isDeviceLoading: false,
          width,
        });
      }, DEBOUNCE_DELAY);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return deviceType;
}
