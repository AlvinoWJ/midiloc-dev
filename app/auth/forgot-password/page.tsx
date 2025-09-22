"use client";

import { DesktopForgotPasswordForm } from "@/components/desktop/forgot-password-form";
import { MobileForgotPasswordForm } from "@/components/mobile/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      {/* Mobile & Tablet */}
      <div className="block lg:hidden">
        <MobileForgotPasswordForm />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopForgotPasswordForm />
      </div>
    </div>
  );
}
