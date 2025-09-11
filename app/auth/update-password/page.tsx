import { UpdatePasswordForm } from "@/components/update-password-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      {/* Bagian kiri (card form) */}
      <div className="flex min-h-screen w-full items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-sm">
          <UpdatePasswordForm />
        </div>
      </div>

      {/* Bagian kanan (gambar + background merah) */}
      <div className="flex flex-col items-center justify-center bg-red-600 text-white p-6">
        <Image
          src="/Location.jpg"
          alt="Location Illustration"
          width={400}
          height={400}
          priority
        />
        <h1 className="mt-6 text-2xl font-bold">LOCATION</h1>
      </div>
    </div>
  );
}
