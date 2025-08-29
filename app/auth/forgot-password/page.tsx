import { ForgotPasswordForm } from "@/components/forgot-password-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      {/* Kiri - Card dengan bg putih */}
      <div className="flex items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
        </div>
      </div>

      {/* Kanan - Gambar dengan bg merah */}
      <div className="flex flex-col items-center justify-center bg-red-600 p-6">
        <Image
          src="/Location.jpg"
          alt="Location Illustration"
          width={350}
          height={350}
          priority
        />
        <h1 className="mt-6 text-2xl font-bold text-white">LOCATION</h1>
      </div>
    </div>
  );
}
