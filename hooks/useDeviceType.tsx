import { useState, useEffect } from "react";

// 1. Definisikan breakpoint sebagai konstanta agar mudah diubah.
const TABLET_BREAKPOINT = 965;
const DESKTOP_BREAKPOINT = 1024;
const DEBOUNCE_DELAY = 150;

interface DeviceType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width?: number;
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: undefined,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setDeviceType({
          isMobile: width < TABLET_BREAKPOINT,
          isTablet: width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT,
          isDesktop: width >= DESKTOP_BREAKPOINT,
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
