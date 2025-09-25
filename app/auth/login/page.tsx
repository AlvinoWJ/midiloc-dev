"use client";

import { useDevice } from "@/app/context/DeviceContext";
import { DesktopLoginForm } from "@/components/desktop/login-form";
import { MobileLoginForm } from "@/components/mobile/login-form";

export default function LoginPage() {
  const { isMobile } = useDevice();

  // Render komponen yang sesuai berdasarkan nilai dari context
  return isMobile ? <MobileLoginForm /> : <DesktopLoginForm />;
}
