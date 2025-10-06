"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

type ForgotPasswordFormProps = Readonly<React.ComponentPropsWithoutRef<"div">>;

export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  // --- State and Logic ---
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Responsif ---
  return (
    <div
      className={cn("min-h-screen", "lg:grid lg:grid-cols-2", className)}
      {...props}
    >
      {/* Sisi Kiri (Form) */}
      <div className="relative flex min-h-screen items-center justify-center p-4 py-8 lg:bg-white lg:p-8">
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

        {/* Card untuk mobile dan desktop */}
        <Card className="w-full max-w-md rounded-3xl bg-white shadow-lg lg:rounded-lg lg:shadow-none">
          <CardHeader className="flex flex-col items-center space-y-2 pt-8">
            <Image
              src="/midiloc.png"
              alt="Alfamidi Logo"
              width={350}
              height={90}
              priority
              className="h-auto w-[220px] lg:w-[350px]"
            />
          </CardHeader>
          <CardContent className="px-6 pb-8 lg:px-8">
            {success ? (
              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-semibold">
                  📩 Check Your Email
                </h2>
                <p className="text-sm text-gray-500">
                  We&apos;ve sent you instructions to reset your password.
                </p>
                <Link href="/auth/login" className="block w-full">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col gap-6"
              >
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="
                      text-sm
                      placeholder:text-sm
                      autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]
                      autofill:[-webkit-text-fill-color:theme(colors.black)]
                      selection:bg-gray-200 selection:text-black 
                      bg-white border-gray-300 text-black 
                      placeholder-gray-400
                    "
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Password"}
                </Button>

                <p className="text-center text-sm">
                  Remembered your password?{" "}
                  <Link
                    href="/auth/login"
                    className="ufont-semibold text-primary"
                  >
                    Login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sisi Kanan (Gambar) - Hanya tampil di desktop */}
      <div className="relative hidden h-screen w-full lg:block">
        <Image
          src="/bg_alfamidi.png"
          alt="Alfamidi Illustration"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}