/**
 * Root Layout Component
 * ----------------------
 * File ini berfungsi sebagai wrapper utama aplikasi Next.js.
 * Semua provider global, font, metadata, dan konfigurasi tema
 * diatur melalui komponen ini.
 */

import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Poppins } from "next/font/google";
import { SidebarProvider } from "@/hooks/useSidebar";
import { AlertProvider } from "@/components/shared/alertcontext";
import "./globals.css";

/**
 * Load Google Font: Poppins
 * - subsets: Latin character set
 * - display: swap untuk meningkatkan performance rendering
 * - variable: custom CSS variable untuk Tailwind
 */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "600"],
});

/**
 * Base URL untuk metadata
 * - Jika Vercel menyediakan URL akan digunakan (deployment)
 * - Jika tidak (local), fallback ke http://localhost:3000
 */
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

/**
 * Metadata konfigurasi untuk aplikasi
 * Digunakan oleh Next.js <head> otomatis pada App Router
 */
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Midiloc",
  description: "The best location management app in the universe",
  icons: {
    icon: "/Midiloc_logo.png",
  },
};

/**
 * RootLayout
 * ----------
 * Komponen layout utama aplikasi Next.js 13+ App Router.
 *
 * Props:
 * - children (React.ReactNode): konten halaman yang dibungkus provider global
 *
 * Provider yang digunakan:
 * - ThemeProvider → mengatur tema aplikasi
 * - AlertProvider → menyediakan global alert context
 * - SidebarProvider → state global sidebar
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Set font Poppins dan antialiasing */}
      <body className={`${poppins.className} antialiased`}>
        {/* ThemeProvider: paksa ke tema light, tetapi tetap mendeteksi sistem */}
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global alert provider */}
          <AlertProvider>
            {/* Sidebar global state provider */}
            <SidebarProvider>{children}</SidebarProvider>
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
