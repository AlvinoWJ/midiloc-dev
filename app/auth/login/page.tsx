import { LoginForm } from "@/components/desktop/login-form";
import Image from "next/image";

export default function Page() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2">
      <div className="relative flex flex-col items-center justify-center p-6 text-white">
        <Image
          src="/bg_alfamidi2.svg"
          alt="Alfamidi Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-red-800 opacity-40"></div>
        <div className="relative z-10 text-center"></div>
      </div>
      <div className="flex items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
