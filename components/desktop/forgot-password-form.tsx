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

export function DesktopForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
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

  return (
    <div
      className={cn("grid min-h-screen grid-cols-2 bg-white", className)}
      {...props}
    >
      {/* Left side (Forgot Password Card) */}
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
            {success ? (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">📩 Check Your Email</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent you instructions to reset your password.
                </p>
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
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

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Password"}
                </Button>

                <p className="text-center text-sm">
                  Remembered your password?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    Login
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side (Image) */}
      <div className="relative w-full h-full">
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
