"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "@/components/desktop/alertcontext";
import { useRouter } from "next/navigation";

type ForgotPasswordFormProps = Readonly<React.ComponentPropsWithoutRef<"div">>;

// Tipe untuk mengelola alur UI dalam beberapa langkah
type Step =
  | "enter_email"
  | "enter_code"
  | "enter_new_password";

// --- Komponen Ikon ---
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);


export function ForgotPasswordForm({
  className,
  ...props
}: ForgotPasswordFormProps) {
  // --- State and Logic ---
  const [step, setStep] = useState<Step>("enter_email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showToast } = useAlert();
  const router = useRouter();
  const supabase = createClient();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Countdown Timer Effect ---
  useEffect(() => {
    if (step !== "enter_code" || countdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);


  // Langkah 1: Mengirim email pemulihan password
  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

    if (resetError) {
      showToast({ type: 'error', message: 'Email tidak terdaftar dalam database kami.' });
      setIsLoading(false);
      return;
    }
    
    setStep("enter_code");
    setCountdown(60); 
    setIsLoading(false);
  };

  // --- Kirim ulang kode OTP ---
  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setToken("");
      setCountdown(60);
      showToast({ type: 'success', message: 'Kode verifikasi baru telah dikirim.' });
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : "Gagal mengirim ulang kode." });
    } finally {
      setIsResending(false);
    }
  };


  // Langkah 2: Memverifikasi kode OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) {
      showToast({ type: 'error', message: "Silakan masukkan 6 digit kode lengkap." });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });
      if (verifyError) throw verifyError;
      if (!data.session) throw new Error("Could not verify your identity. Please try again.");
      setStep("enter_new_password");
    } catch {
      showToast({ type: 'error', message: 'Kode yang Anda masukkan salah. Silakan cek kembali kode pada email Anda.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 3: Mengatur ulang password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: 'error', message: 'Password tidak sama / tidak sesuai.' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      await supabase.auth.signOut();
      showToast({ type: 'success', title: 'Sukses', message: 'Password berhasil di ubah!' });
      router.push('/auth/login');
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : "Terjadi kesalahan saat mereset password." });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers untuk Input OTP ---
  const handleTokenChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const char = value.slice(-1);

    const newToken = [...token.split("")];
    newToken[index] = char;
    setToken(newToken.join("").slice(0, 6));

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && e.currentTarget.value === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    setToken(pastedData);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // --- UI ---
  const renderContent = () => {
    const inputClasses = "text-sm placeholder:text-sm bg-white border-gray-300 text-black placeholder-gray-400 selection:bg-gray-200 selection:text-black autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)] autofill:[-webkit-text-fill-color:theme(colors.black)]";
    const passwordInputClasses = cn(inputClasses, "pr-10");

    switch (step) {
      case "enter_email":
        return (
          <form onSubmit={handleSendRecoveryEmail} className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Lupa Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan email Anda untuk menerima kode verifikasi.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan alamat email Anda"
                className={inputClasses}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Mengirim..." : "Kirim Kode Verifikasi"}
            </Button>
            <p className="text-center text-sm">
              Ingat password Anda?{" "}
              <Link href="/auth/login" className="font-semibold text-primary">
                Login
              </Link>
            </p>
          </form>
        );

      case "enter_code":
        return (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Cek Email Anda</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kami telah mengirim kode ke{" "}
                <span className="font-medium">{email}</span>.
              </p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="token-0" className="text-center">
                Kode Verifikasi
              </Label>
              <div
                className="flex justify-center gap-2 sm:gap-3"
                onPaste={handlePaste}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    id={`token-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={token[index] || ""}
                    onChange={(e) => handleTokenChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={(e) => e.target.select()}
                    className="aspect-square h-auto w-full max-w-[48px] rounded-lg text-center text-2xl font-bold bg-white border-gray-300 text-black"
                    autoComplete="one-time-code"
                    required
                  />
                ))}
              </div>
            </div>
            <div className="text-center text-sm text-gray-500">
              {countdown > 0 ? (
                <p>Kirim ulang kode dalam {formatTime(countdown)}</p>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleResendOtp}
                  disabled={isResending}
                >
                  {isResending ? "Mengirim ulang..." : "Kirim Ulang Kode"}
                </Button>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memverifikasi..." : "Verifikasi"}
            </Button>
          </form>
        );

      case "enter_new_password":
        return (
          <form
            onSubmit={handleUpdatePassword}
            className="flex flex-col gap-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold">Atur Password Baru</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kode terverifikasi. Silakan buat password baru Anda.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Masukkan password baru"
                  className={passwordInputClasses}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
               <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi password baru"
                  className={passwordInputClasses}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                 <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Reset Password"}
            </Button>
          </form>
        );
    }
  };

  return (
    <div
      className={cn("min-h-screen", "lg:grid lg:grid-cols-2", className)}
      {...props}
    >
      <div className="relative flex min-h-screen items-center justify-center p-4 py-8 lg:bg-white lg:p-8">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <Image
            src="/bg_alfamidi.png"
            alt="Alfamidi Background"
            fill
            priority
            className="object-cover"
          />
        </div>
        <Card className="w-full max-w-md rounded-3xl bg-white shadow-lg lg:rounded-lg lg:shadow-none">
          <CardHeader className="flex flex-col items-center space-y-2 pt-8">
            <Image
              src="/midiloc.png"
              alt="Alfamidi Logo"
              width={350}
              height={90}
              priority
              className="h-auto w-[22-0px] lg:w-[350px]"
            />
          </CardHeader>
          <CardContent className="px-6 pb-8 lg:px-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
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

