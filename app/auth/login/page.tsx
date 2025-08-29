import { LoginForm } from "@/components/login-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      {/* Bagian kiri */}
      <div className="flex flex-col items-center justify-center bg-red-600 p-6 text-white">
        <Image
          src="/Location.jpg" // ganti sesuai path gambar kamu
          alt="Location Illustration"
          width={400}
          height={400}
          priority
        />
        <h1 className="mt-4 text-2xl font-bold">HIIIII akuu albyyy</h1>
      </div>

      {/* Bagian kanan */}
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
