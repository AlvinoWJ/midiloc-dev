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

export function DesktopLoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
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

  return (
    <div
      className={cn("grid min-h-screen grid-cols-2 bg-white", className)}
      {...props}
    >
      {/* Left side (Image) */}
      <div className="relative w-full h-full">
        <Image
          src="/bg_alfamidi.png"
          alt="Alfamidi Illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right side (Login Card) */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="flex flex-col items-center space-y-2">
            <Image
              src="/midiloc.png"
              alt="Alfamidi Logo"
              width={350}
              height={90}
              priority
            />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="placeholder:text-sm"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pr-10 placeholder:text-sm"
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
                        src={
                          showPassword ? "/icons/Hide.png" : "/icons/show.png"
                        }
                        alt="toggle password"
                        width={21}
                        height={21}
                      />
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && <p className="text-sm text-red-500">{error}</p>}

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>

              {/* Forgot Password link (di bawah form) */}
              <div className="mt-4 text-center text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="underline underline-offset-4"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
