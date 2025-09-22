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

export function MobileForgotPasswordForm({
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
      className={cn(
        "relative min-h-screen flex items-center justify-center px-4 py-8",
        className
      )}
      {...props}
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/bg_alfamidi.png"
          alt="Alfamidi Background"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Forgot Password Card */}
      <Card className="w-full max-w-md shadow-lg bg-white">
        <CardHeader className="flex flex-col items-center space-y-2">
          <Image
            src="/midiloc.png"
            alt="Alfamidi Logo"
            width={220}
            height={60}
            priority
          />
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-3">
              <h2 className="text-lg font-semibold">📩 Check Your Email</h2>
              <p className="text-xs text-muted-foreground">
                We&apos;ve sent you instructions to reset your password.
              </p>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full text-sm py-2">Back to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <div className="grid gap-1">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="placeholder:text-xs text-xs"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full text-sm py-2"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Password"}
              </Button>

              <p className="text-center text-xs mt-2">
                Remembered your password?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-2"
                >
                  Login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
