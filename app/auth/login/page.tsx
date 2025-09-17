"use client";

import { DesktopLoginForm } from "@/components/desktop/login-form";
import { MobileLoginForm } from "@/components/mobile/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      {/* Mobile & Tablet */}
      <div className="block lg:hidden">
        <MobileLoginForm />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopLoginForm />
      </div>
    </div>
  );
}
