"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function LoginFormFields({
  handleLogin,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  error,
}: {
  readonly handleLogin: (e: React.FormEvent) => void;
  readonly email: string;
  readonly setEmail: (value: string) => void;
  readonly password: string;
  readonly setPassword: (value: string) => void;
  readonly showPassword: boolean;
  readonly setShowPassword: (value: boolean) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
}) {
  return (
    <form onSubmit={handleLogin}>
      <div className="flex flex-col gap-6">
        {/* Email */}
        <div className="grid gap-2">
          <Label htmlFor="email" className={"text-gray-900"}>Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            className="text-sm placeholder:text-sm autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] autofill:[-webkit-text-fill-color:theme(colors.black)] selection:bg-gray-200 selection:text-black bg-white border-gray-300 text-black placeholder-gray-400"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <Label htmlFor="password" className={"text-gray-900"}>Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pr-10 text-sm placeholder:text-sm autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] autofill:[-webkit-text-fill-color:theme(colors.black)] selection:bg-gray-200 selection:text-black bg-white border-gray-300 text-black placeholder-gray-400"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              <Image
                src={showPassword ? "/icons/Hide.png" : "/icons/show.png"}
                alt="toggle password"
                width={21}
                height={21}
              />
            </button>
          </div>
          {/* Forgot Password */}
          <div className="mt-1 text-right text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-primary"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
}

type LoginFormProps = Readonly<React.ComponentPropsWithoutRef<"div">>;

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  // --- State dan logika handleLogin ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formProps = {
    handleLogin,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
  };

  // --- UI Responsif ---
  return (
    <div
      className={cn("min-h-screen", "lg:grid lg:grid-cols-2", className)}
      {...props}
    >
      {/* Sisi Kiri (Gambar) - Hanya tampil di desktop */}
      <div className="relative hidden h-screen w-full lg:block">
        <Image
          src="/bg_alfamidi.png"
          alt="Alfamidi Illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Sisi Kanan (Form Login) */}
      <div className="relative flex min-h-screen items-center justify-center p-4 py-8 lg:min-h-0 lg:bg-white lg:p-8">
        {/* Latar belakang untuk mobile/tablet */}
        <div className="absolute inset-0 -z-10 lg:hidden">
          <Image
            src="/bg_alfamidi.png"
            alt="Alfamidi Background"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Kontainer Form untuk mobile dan desktop */}
        <div className="w-full max-w-md">
          {/* Tampilan mobile menggunakan Card */}
          <Card className="rounded-3xl bg-white shadow-lg lg:hidden">
            <CardHeader className="flex flex-col items-center space-y-4 pt-8">
              <Image
                src="/midiloc.png"
                alt="Alfamidi Logo"
                width={220}
                height={60}
                priority
              />
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <LoginFormFields {...formProps} />
            </CardContent>
          </Card>

          {/* Tampilan desktop polos tanpa Card */}
          <div className="hidden lg:block">
            <div className="mb-8 flex justify-center">
              <Image
                src="/midiloc.png"
                alt="Alfamidi Logo"
                width={350}
                height={90}
                priority
              />
            </div>
            <LoginFormFields {...formProps} />
          </div>
        </div>
      </div>
    </div>
  );
}

